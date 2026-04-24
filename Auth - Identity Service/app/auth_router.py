from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
import httpx
import secrets
import string
from jose import jwt, JWTError
from app import models, schemas, database, security, config

router = APIRouter(prefix="/auth", tags=["auth"])

ALLOWED_REVIEWER_SCIENCE_FIELDS = {
    "economics",
    "politology",
    "jurisprudence",
    "pedagogy",
    "philology",
    "psychology",
    "sociology",
    "management",
    "philosophy",
    "cultural_studies",
    "information_technology",
    "other",
}

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def sync_profile_role(user_id: int, role: str) -> None:
    try:
        with httpx.Client(timeout=5.0) as client:
            current_roles: list[str] = []
            current_profile_response = client.get(f"{config.USER_SERVICE_URL}/users/{user_id}")
            if current_profile_response.status_code == 200:
                current_profile = current_profile_response.json() or {}
                current_roles = [item for item in (current_profile.get("roles") or []) if isinstance(item, str) and item]
            client.patch(
                f"{config.USER_SERVICE_URL}/users/internal/{user_id}/roles",
                json={"roles": list(dict.fromkeys([role, *current_roles]))},
                headers={"X-Service-Secret": config.SHARED_SERVICE_SECRET},
            )
    except Exception:
        pass


def send_account_status_notification(user: models.User, is_active: bool) -> None:
    role_titles = {
        "author": "автора",
        "reviewer": "рецензента",
        "editor": "редактора",
        "layout": "верстальщика",
        "admin": "администратора",
    }
    display_name = user.full_name or user.first_name or user.username
    cabinet_url = f"{config.PUBLIC_BASE_URL}/login"
    role_title = role_titles.get(user.role, "пользователя")

    if is_active:
        title = "Аккаунт активирован"
        message = (
            f"Здравствуйте, {display_name}. "
            f"Ваш аккаунт в журнале «Известия университета Туран-Астана» активирован администратором. "
            f"Роль аккаунта: {role_title}. "
            f"Теперь вы можете войти в систему и продолжить работу в личном кабинете: {cabinet_url}"
        )
    else:
        title = "Аккаунт деактивирован"
        message = (
            f"Здравствуйте, {display_name}. "
            f"Ваш аккаунт в журнале «Известия университета Туран-Астана» был деактивирован администратором. "
            f"Доступ к личному кабинету временно ограничен. "
            f"Если вы считаете это ошибкой, свяжитесь с редакцией или администратором системы."
        )

    try:
        with httpx.Client(timeout=5.0) as client:
            client.post(
                f"{config.NOTIFICATIONS_SERVICE_URL}/notifications/internal",
                json={
                    "user_id": user.id,
                    "type": "system",
                    "title": title,
                    "message": message,
                    "related_entity": f"auth:activation:{user.id}",
                },
                headers={"X-Service-Secret": config.SHARED_SERVICE_SECRET},
            )
    except Exception:
        pass


def get_profiles_map() -> dict[int, dict]:
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(
                f"{config.USER_SERVICE_URL}/users/internal/profiles",
                headers={"X-Service-Secret": config.SHARED_SERVICE_SECRET},
            )
            if response.status_code != 200:
                return {}
            profiles = response.json() or []
            return {
                int(item["user_id"]): item
                for item in profiles
                if isinstance(item, dict) and item.get("user_id") is not None
            }
    except Exception:
        return {}


def get_effective_roles(user_id: int, primary_role: str) -> list[str]:
    roles: list[str] = [primary_role]
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(f"{config.USER_SERVICE_URL}/users/{user_id}")
            if response.status_code == 200:
                profile = response.json() or {}
                profile_roles = profile.get("roles") or []
                roles = list(dict.fromkeys([primary_role, *[role for role in profile_roles if isinstance(role, str) and role]]))
    except Exception:
        pass
    return roles


def generate_temporary_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def normalize_preferred_language(value: str | list[str] | None) -> str | None:
    if value is None:
        return None
    if isinstance(value, list):
        normalized = [item.strip() for item in value if isinstance(item, str) and item.strip()]
        return ",".join(dict.fromkeys(normalized)) or None
    if isinstance(value, str):
        return value.strip() or None
    return None


def normalize_reviewer_science_fields(value: list[str] | None) -> list[str]:
    if not value:
        return []
    normalized: list[str] = []
    for item in value:
        if not isinstance(item, str):
            continue
        candidate = item.strip()
        if not candidate or candidate not in ALLOWED_REVIEWER_SCIENCE_FIELDS or candidate in normalized:
            continue
        normalized.append(candidate)
    return normalized


def normalize_reviewer_science_other(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_username = db.query(models.User).filter(models.User.username == user.username).first()
    existing_email = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_username or existing_email:
        field_errors: dict[str, str] = {}
        if existing_username:
            field_errors["username"] = "Пользователь с таким логином уже существует"
        if existing_email:
            field_errors["email"] = "Пользователь с таким email уже существует"
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Не удалось завершить регистрацию",
                "fields": field_errors,
            },
        )

    normalized_preferred_language = normalize_preferred_language(user.preferred_language)
    normalized_reviewer_science_fields = normalize_reviewer_science_fields(user.reviewer_science_fields)
    normalized_reviewer_science_other = normalize_reviewer_science_other(user.reviewer_science_other)

    if user.role == "reviewer" and not normalized_preferred_language:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Для рецензента нужно выбрать язык рецензирования",
                "fields": {
                    "preferred_language": "Выберите язык рецензирования",
                },
            },
        )
    if user.role == "reviewer" and not normalized_reviewer_science_fields:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Для рецензента нужно выбрать хотя бы одно направление наук",
                "fields": {
                    "reviewer_science_fields": "Выберите хотя бы одно направление наук",
                },
            },
        )
    if user.role == "reviewer" and "other" in normalized_reviewer_science_fields and not normalized_reviewer_science_other:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Заполните поле 'Иное' для направления наук",
                "fields": {
                    "reviewer_science_other": "Заполните поле 'Иное'",
                },
            },
        )
    if "other" not in normalized_reviewer_science_fields:
        normalized_reviewer_science_other = None
    hashed_password = security.hash_password(user.password)
    
    # Авто-активация только для роли автора; остальные неактивны
    is_active = True if user.role in {"author", "admin"} else False
    
    new_user = models.User(
        username=user.username,
        full_name=user.full_name,
        first_name=user.first_name,
        last_name=user.last_name,
        organization=user.organization,
        institution=user.institution,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        is_active=is_active,
        accept_terms=user.accept_terms,
        notify_status=user.notify_status,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create profile in User Profile Service
    try:
        profile_payload = {
            "user_id": new_user.id,
            "full_name": new_user.full_name or new_user.username,
            "roles": [new_user.role],
            "organization": new_user.organization,
            "preferred_language": normalized_preferred_language or "en",
            "reviewer_science_fields": normalized_reviewer_science_fields,
            "reviewer_science_other": normalized_reviewer_science_other,
            "phone": None,
        }
        with httpx.Client(timeout=5.0) as client:
            # Call users service with trailing slash to avoid FastAPI 307 redirect
            client.post(f"{config.USER_SERVICE_URL}/users/", json=profile_payload)
    except Exception:
        # Fail-soft: auth registration succeeds even if profile call fails
        pass

    # Create notification (and email) via Notification Service
    try:
        with httpx.Client(timeout=5.0) as client:
            if new_user.role in {"author", "admin"}:
                # Автор активируется сразу, отправим приветственное письмо
                notify_payload = {
                    "user_id": new_user.id,
                    "type": "system",
                    "title": "Регистрация завершена",
                    "message": (
                        "Вы успешно зарегистрированы и ваш аккаунт активирован как Автор. "
                        "Вы можете войти и начать работу."
                    ),
                    "related_entity": f"auth:register:{new_user.id}",
                }
                client.post(
                    f"{config.NOTIFICATIONS_SERVICE_URL}/notifications/internal",
                    json=notify_payload,
                    headers={"X-Service-Secret": config.SHARED_SERVICE_SECRET},
                )
            else:
                # Для редакторов/рецензентов требуем подтверждение почты, но активацию делает админ
                verify_token = security.create_access_token({"sub": str(new_user.id), "purpose": "email_verify"})
                verify_link = f"{config.PUBLIC_BASE_URL}/auth/verify-email?token={verify_token}"
                notify_payload = {
                    "user_id": new_user.id,
                    "type": "system",
                    "title": "Подтверждение электронной почты",
                    "message": (
                        "Вы успешно зарегистрированы в системе «Известия университета Туран-Астана». "
                        "Подтвердите эл. почту по ссылке: "
                        f"{verify_link}. "
                        "После подтверждения администратор активирует ваш аккаунт."
                    ),
                    "related_entity": f"auth:register:{new_user.id}",
                }
                client.post(
                    f"{config.NOTIFICATIONS_SERVICE_URL}/notifications/internal",
                    json=notify_payload,
                    headers={"X-Service-Secret": config.SHARED_SERVICE_SECRET},
                )
    except Exception:
        # Fail-soft: continue even if notifications service is unavailable
        pass

    return new_user


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify email using a signed token and activate the user."""
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        sub = payload.get("sub")
        purpose = payload.get("purpose")
        if not sub or purpose != "email_verify":
            raise HTTPException(status_code=400, detail="Invalid verification token")
        user_id = int(sub)
    except (JWTError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # После подтверждения почты: авто-активация только для автора
    if user.role in {"author", "admin"}:
        user.is_active = True
        db.commit()
        return {"status": "verified", "activated": True, "user_id": user.id}
    else:
        # Для редактора/рецензента аккаунт остаётся неактивным до решения админа
        db.commit()
        return {"status": "verified", "activated": False, "user_id": user.id}

@router.post("/login", response_model=schemas.Token)
def login(form_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Allow login via either username or email using the same field
    identifier = form_data.username
    user = db.query(models.User).filter(
        ((models.User.username == identifier) | (models.User.email == identifier)),
        models.User.is_hidden == False,
    ).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=403, 
            detail="Account is pending approval. Please wait for administrator confirmation."
        )
    
    # JWT spec expects `sub` to be a string; cast user.id accordingly
    access_token = security.create_access_token({"sub": str(user.id), "roles": get_effective_roles(user.id, user.role)})
    refresh_token = security.create_refresh_token({"sub": str(user.id)})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/refresh", response_model=schemas.Token)
def refresh_token(payload: schemas.RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh access token using a valid refresh token.

    Accepts JSON: {"refresh_token": "..."}
    Returns: {"access_token": "...", "refresh_token": "...", "token_type": "bearer"}
    """
    if not payload.refresh_token:
        raise HTTPException(status_code=400, detail="Missing refresh_token")

    try:
        decoded = jwt.decode(payload.refresh_token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        sub = decoded.get("sub")
        if sub is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        user_id = int(sub)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account inactive")

    # Issue a new access token and rotate refresh token
    access_token = security.create_access_token({"sub": str(user.id), "roles": get_effective_roles(user.id, user.role)})
    new_refresh_token = security.create_refresh_token({"sub": str(user.id)})
    return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}


def get_current_user_id(authorization: str = Header(None)) -> int:
    """Extract user_id from JWT token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = parts[1]
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(user_id)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_active_user(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)) -> models.User:
    """Get current user and verify they are active"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_hidden:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Your account is inactive. Please contact administrator."
        )
    return user


@router.get("/me", response_model=schemas.UserFullInfo)
def get_user_full_info(
    user: models.User = Depends(get_current_active_user)
):
    """Get complete user information from Auth and User Profile services"""
    # User is already fetched and validated by get_current_active_user
    
    # Prepare response with auth data
    user_info = {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "organization": user.organization,
        "institution": user.institution,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "is_hidden": user.is_hidden,
        "accept_terms": user.accept_terms,
        "notify_status": user.notify_status,
        "profile_id": None,
        "phone": None,
        "preferred_language": None,
        "reviewer_science_fields": [],
        "reviewer_science_other": None,
        "roles": [user.role],
    }
    
    # Try to get profile from User Profile Service
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(f"{config.USER_SERVICE_URL}/users/{user.id}")
            if response.status_code == 200:
                profile_data = response.json()
                user_info["profile_id"] = profile_data.get("id")
                user_info["phone"] = profile_data.get("phone")
                user_info["preferred_language"] = profile_data.get("preferred_language")
                user_info["reviewer_science_fields"] = profile_data.get("reviewer_science_fields", [])
                user_info["reviewer_science_other"] = profile_data.get("reviewer_science_other")
                user_info["roles"] = profile_data.get("roles", [user.role])
                # Update organization from profile if it's more recent
                if profile_data.get("organization"):
                    user_info["organization"] = profile_data.get("organization")
    except Exception:
        # Fail-soft: return auth data even if profile service is unavailable
        pass
    
    return user_info


@router.get("/users/{user_id}", response_model=schemas.UserOut)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Получить информацию о пользователе по ID.
    Внутренний эндпоинт для межсервисного взаимодействия.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# Admin endpoints
def require_admin(user: models.User = Depends(get_current_active_user)) -> models.User:
    """Verify that current user has admin role"""
    if user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required"
        )
    return user


@router.get("/admin/pending-users", response_model=list[schemas.UserOut])
def get_pending_users(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all users waiting for activation (editors and reviewers)"""
    pending_users = db.query(models.User).filter(
        models.User.is_hidden == False,
        models.User.is_active == False,
        models.User.role.in_(["editor", "reviewer"])
    ).all()
    return pending_users


@router.get("/admin/users", response_model=list[schemas.AdminUserListItem])
def get_all_users(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    profiles_map = get_profiles_map()
    users = (
        db.query(models.User)
        .filter(models.User.is_hidden == False)
        .order_by(models.User.id.desc())
        .all()
    )
    result: list[dict] = []
    for user in users:
        profile = profiles_map.get(user.id, {})
        result.append(
            {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "organization": profile.get("organization") or user.organization,
                "institution": user.institution,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "is_hidden": user.is_hidden,
                "accept_terms": user.accept_terms,
                "notify_status": user.notify_status,
                "phone": profile.get("phone"),
                "preferred_language": profile.get("preferred_language"),
                "reviewer_science_fields": profile.get("reviewer_science_fields", []),
                "reviewer_science_other": profile.get("reviewer_science_other"),
                "roles": profile.get("roles", [user.role]),
                "profile_id": profile.get("id"),
                "is_council_member": profile.get("is_council_member"),
                "is_collegium_member": profile.get("is_collegium_member"),
            }
        )
    return result


@router.get("/admin/users/stats", response_model=schemas.AdminUserStats)
def get_user_stats(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(models.User).filter(models.User.is_hidden == False).all()
    by_role: dict[str, int] = {}
    active = 0
    inactive = 0
    pending = 0
    for user in users:
        by_role[user.role] = by_role.get(user.role, 0) + 1
        if user.is_active:
            active += 1
        else:
            inactive += 1
            if user.role in {"editor", "reviewer"}:
                pending += 1
    return {
        "total": len(users),
        "active": active,
        "inactive": inactive,
        "pending": pending,
        "by_role": by_role,
    }


@router.get("/admin/users/{user_id}", response_model=schemas.AdminUserDetail)
def get_admin_user_detail(
    user_id: int,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    profiles_map = get_profiles_map()
    user = (
        db.query(models.User)
        .filter(models.User.id == user_id, models.User.is_hidden == False)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = profiles_map.get(user.id, {})
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "organization": profile.get("organization") or user.organization,
        "institution": user.institution,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "is_hidden": user.is_hidden,
        "accept_terms": user.accept_terms,
        "notify_status": user.notify_status,
        "phone": profile.get("phone"),
        "preferred_language": profile.get("preferred_language"),
        "reviewer_science_fields": profile.get("reviewer_science_fields", []),
        "reviewer_science_other": profile.get("reviewer_science_other"),
        "roles": profile.get("roles", [user.role]),
        "profile_id": profile.get("id"),
        "is_council_member": profile.get("is_council_member"),
        "is_collegium_member": profile.get("is_collegium_member"),
    }


@router.patch("/admin/users/{user_id}/activate", response_model=schemas.UserOut)
def activate_user(
    user_id: int,
    activation: schemas.UserActivationUpdate,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Activate or deactivate a user account"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_hidden:
        raise HTTPException(status_code=404, detail="User not found")

    previous_is_active = user.is_active
    user.is_active = activation.is_active
    db.commit()
    db.refresh(user)
    if previous_is_active != user.is_active:
        send_account_status_notification(user, user.is_active)
    return user


@router.patch("/admin/users/{user_id}/role", response_model=schemas.UserOut)
def update_user_role(
    user_id: int,
    role_update: schemas.UserRoleUpdate,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update a user's role (e.g., set to 'admin')."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_hidden:
        raise HTTPException(status_code=404, detail="User not found")

    allowed_roles = {"author", "editor", "reviewer", "layout", "admin"}
    if role_update.role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Invalid role")

    user.role = role_update.role
    # If promoting to admin, ensure active
    if user.role == "admin":
        user.is_active = True
    db.commit()
    db.refresh(user)
    sync_profile_role(user.id, user.role)
    return user


@router.post("/admin/users/{user_id}/reset-password", response_model=schemas.AdminPasswordResetResponse)
def reset_user_password(
    user_id: int,
    payload: schemas.AdminPasswordResetRequest,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_hidden:
        raise HTTPException(status_code=404, detail="User not found")

    temporary_password = payload.new_password or generate_temporary_password()
    user.hashed_password = security.hash_password(temporary_password)
    db.commit()
    return {
        "user_id": user.id,
        "temporary_password": temporary_password,
        "generated": payload.new_password is None,
    }


@router.delete("/admin/users/{user_id}", response_model=schemas.AdminUserHideResponse)
def hide_user(
    user_id: int,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot hide your own account")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_hidden:
        return {"user_id": user.id, "is_hidden": True}

    user.is_hidden = True
    user.is_active = False
    db.commit()
    return {"user_id": user.id, "is_hidden": True}
