from datetime import datetime, timedelta
import hashlib
import html
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
import httpx
import secrets
import string
from urllib.parse import urlencode
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
ALLOWED_ACADEMIC_DEGREES = {
    "candidate",
    "doctor",
    "phd",
    "master",
    "bachelor",
}
PUBLIC_REGISTRATION_ROLES = {"author", "editor", "reviewer"}
BLOCKED_REGISTRATION_ROLES = {"admin", "administrator"}
PASSWORD_RESET_GENERIC_MESSAGE = "Если аккаунт с такой почтой существует, мы отправили ссылку для восстановления пароля."

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
                    "template_key": "account_status_changed",
                    "template_variables": {
                        "display_name": display_name,
                        "role": role_title,
                        "status": "active" if is_active else "inactive",
                        "cabinet_url": cabinet_url,
                    },
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


def update_profile_contact(user_id: int, full_name: str, phone: str | None, organization: str | None) -> None:
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.patch(
                f"{config.USER_SERVICE_URL}/users/internal/{user_id}/contact",
                json={"full_name": full_name, "phone": phone, "organization": organization},
                headers={"X-Service-Secret": config.SHARED_SERVICE_SECRET},
            )
        if response.status_code not in {200, 404}:
            raise HTTPException(status_code=502, detail="Could not update user profile")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not update user profile") from exc


def sync_profile_orcid(user_id: int, orcid: str | None) -> None:
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.patch(
                f"{config.USER_SERVICE_URL}/users/internal/{user_id}/orcid",
                json={"orcid": orcid},
                headers={"X-Service-Secret": config.SHARED_SERVICE_SECRET},
            )
        if response.status_code not in {200, 404}:
            raise HTTPException(status_code=502, detail="Could not update ORCID in user profile")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not update ORCID in user profile") from exc


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


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def normalize_uuid_token(token: str) -> str:
    try:
        return str(uuid.UUID(token.strip()))
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token")


def build_registration_conflict_error(existing_username: bool, existing_email: bool) -> HTTPException:
    field_errors: dict[str, str] = {}
    if existing_username:
        field_errors["username"] = "Пользователь с таким логином уже существует"
    if existing_email:
        field_errors["email"] = "Пользователь с такой почтой уже зарегистрирован"
    return HTTPException(
        status_code=400,
        detail={
            "message": "Не удалось завершить регистрацию",
            "fields": field_errors,
        },
    )


def send_password_reset_notification(user: models.User, reset_link: str) -> None:
    display_name = user.full_name or user.first_name or user.username
    title = "Восстановление пароля"
    text = (
        f"Здравствуйте, {display_name}.\n\n"
        "Для смены пароля перейдите по ссылке:\n"
        f"{reset_link}\n\n"
        f"Ссылка действует {config.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} минут.\n"
        "Если вы не запрашивали восстановление, просто проигнорируйте это письмо."
    )
    escaped_link = html.escape(reset_link, quote=True)
    escaped_name = html.escape(display_name)
    html_body = (
        f"<p>Здравствуйте, {escaped_name}.</p>"
        f"<p>Для смены пароля перейдите по ссылке:</p>"
        f'<p><a href="{escaped_link}">{escaped_link}</a></p>'
        f"<p>Ссылка действует {config.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} минут.</p>"
        "<p>Если вы не запрашивали восстановление, просто проигнорируйте это письмо.</p>"
    )
    try:
        with httpx.Client(timeout=5.0) as client:
            client.post(
                f"{config.NOTIFICATIONS_SERVICE_URL}/notifications/internal/email",
                json={
                    "user_id": user.id,
                    "subject": title,
                    "text": text,
                    "html": html_body,
                    "template_key": "password_reset",
                    "template_variables": {
                        "display_name": display_name,
                        "reset_link": reset_link,
                        "expires_minutes": str(config.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES),
                    },
                },
                headers={"X-Service-Secret": config.SHARED_SERVICE_SECRET},
            )
    except Exception:
        pass


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


def normalize_academic_degrees(value: list[str] | None) -> list[str]:
    if not value:
        return []
    normalized: list[str] = []
    for item in value:
        if not isinstance(item, str):
            continue
        candidate = item.strip()
        if not candidate:
            continue
        if candidate not in ALLOWED_ACADEMIC_DEGREES:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Некорректное значение ученой степени",
                    "fields": {
                        "academic_degrees": "Выберите ученую степень из списка",
                    },
                },
            )
        if candidate in normalized:
            continue
        normalized.append(candidate)
    return normalized


def normalize_orcid(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    if not normalized:
        return None
    normalized = normalized.removeprefix("https://orcid.org/").removeprefix("http://orcid.org/")
    normalized = normalized.upper()
    import re
    if not re.fullmatch(r"\d{4}-\d{4}-\d{4}-[\dX]{4}", normalized):
        raise HTTPException(
            status_code=400,
            detail={"message": "Некорректный ORCID", "fields": {"orcid": "Введите ORCID в формате 0000-0000-0000-0000"}},
        )
    return normalized

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    requested_role = user.role.strip().lower()
    if requested_role in BLOCKED_REGISTRATION_ROLES:
        raise HTTPException(status_code=403, detail="Administrator registration is not allowed")
    if requested_role not in PUBLIC_REGISTRATION_ROLES:
        raise HTTPException(status_code=400, detail="Invalid registration role")

    username = user.username.strip()
    email = str(user.email).strip().lower()
    existing_username = db.query(models.User).filter(models.User.username == username).first()
    existing_email = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if existing_username or existing_email:
        raise build_registration_conflict_error(bool(existing_username), bool(existing_email))

    normalized_preferred_language = normalize_preferred_language(user.preferred_language)
    normalized_academic_degrees = normalize_academic_degrees(user.academic_degrees)
    normalized_orcid = normalize_orcid(user.orcid)
    normalized_reviewer_science_fields = normalize_reviewer_science_fields(user.reviewer_science_fields)
    normalized_reviewer_science_other = normalize_reviewer_science_other(user.reviewer_science_other)

    if requested_role == "reviewer" and not normalized_preferred_language:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Для рецензента нужно выбрать язык рецензирования",
                "fields": {
                    "preferred_language": "Выберите язык рецензирования",
                },
            },
        )
    if requested_role == "reviewer" and not normalized_reviewer_science_fields:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Для рецензента нужно выбрать хотя бы одно направление наук",
                "fields": {
                    "reviewer_science_fields": "Выберите хотя бы одно направление наук",
                },
            },
        )
    if requested_role == "reviewer" and "other" in normalized_reviewer_science_fields and not normalized_reviewer_science_other:
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
    is_active = True if requested_role == "author" else False
    
    new_user = models.User(
        username=username,
        full_name=user.full_name,
        first_name=user.first_name,
        last_name=user.last_name,
        organization=user.organization,
        institution=user.institution,
        email=email,
        hashed_password=hashed_password,
        role=requested_role,
        is_active=is_active,
        accept_terms=user.accept_terms,
        notify_status=user.notify_status,
    )
    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing_username = db.query(models.User).filter(models.User.username == username).first()
        existing_email = db.query(models.User).filter(func.lower(models.User.email) == email).first()
        raise build_registration_conflict_error(bool(existing_username), bool(existing_email))
    db.refresh(new_user)

    # Create profile in User Profile Service
    try:
        profile_payload = {
            "user_id": new_user.id,
            "full_name": new_user.full_name or new_user.username,
            "roles": [new_user.role],
            "organization": new_user.organization,
            "preferred_language": normalized_preferred_language or "en",
            "academic_degrees": normalized_academic_degrees,
            "orcid": normalized_orcid,
            "reviewer_science_fields": normalized_reviewer_science_fields,
            "reviewer_science_other": normalized_reviewer_science_other,
            "phone": None,
        }
        with httpx.Client(timeout=5.0) as client:
            # Call users service with trailing slash to avoid FastAPI 307 redirect
            client.post(
                f"{config.USER_SERVICE_URL}/users/",
                json=profile_payload,
                headers={"X-Service-Secret": config.SHARED_SERVICE_SECRET},
            )
    except Exception:
        # Fail-soft: auth registration succeeds even if profile call fails
        pass

    # Create notification (and email) via Notification Service
    try:
        with httpx.Client(timeout=5.0) as client:
            if new_user.role == "author":
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
                    "template_key": "registration_welcome",
                    "template_variables": {
                        "display_name": new_user.full_name or new_user.first_name or new_user.username,
                    },
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
                    "template_key": "email_verification",
                    "template_variables": {
                        "display_name": new_user.full_name or new_user.first_name or new_user.username,
                        "verification_link": verify_link,
                    },
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


@router.post("/forgot-password", response_model=schemas.MessageResponse)
def forgot_password(
    payload: schemas.ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()
    user = db.query(models.User).filter(
        func.lower(models.User.email) == email,
        models.User.is_hidden == False,
    ).first()

    if user:
        now = datetime.utcnow()
        reset_token = str(uuid.uuid4())
        token_record = models.PasswordResetToken(
            user_id=user.id,
            token_hash=hash_reset_token(reset_token),
            request_uuid=str(uuid.uuid4()),
            created_at=now,
            expires_at=now + timedelta(minutes=config.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES),
            request_ip=request.client.host if request.client else None,
            request_user_agent=(request.headers.get("user-agent") or "")[:512] or None,
        )
        db.add(token_record)
        db.commit()
        reset_link = f"{config.PUBLIC_BASE_URL}/auth/reset-password?token={reset_token}"
        send_password_reset_notification(user, reset_link)

    return {"message": PASSWORD_RESET_GENERIC_MESSAGE}


@router.post("/reset-password", response_model=schemas.MessageResponse)
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    token = normalize_uuid_token(payload.token)
    token_record = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token_hash == hash_reset_token(token),
        models.PasswordResetToken.used_at.is_(None),
        models.PasswordResetToken.expires_at > now,
    ).first()
    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token")

    user = db.query(models.User).filter(models.User.id == token_record.user_id, models.User.is_hidden == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = security.hash_password(payload.new_password)
    token_record.used_at = now
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id,
        models.PasswordResetToken.used_at.is_(None),
        models.PasswordResetToken.id != token_record.id,
    ).update({"used_at": now}, synchronize_session=False)
    db.commit()
    return {"message": "Пароль обновлен. Теперь вы можете войти с новым паролем."}


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
    if user.role == "author":
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
    user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
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
        "academic_degrees": [],
        "orcid": None,
        "orcid_verified": False,
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
                if profile_data.get("full_name"):
                    user_info["full_name"] = profile_data.get("full_name")
                user_info["phone"] = profile_data.get("phone")
                user_info["preferred_language"] = profile_data.get("preferred_language")
                user_info["academic_degrees"] = profile_data.get("academic_degrees", [])
                user_info["orcid"] = profile_data.get("orcid")
                user_info["reviewer_science_fields"] = profile_data.get("reviewer_science_fields", [])
                user_info["reviewer_science_other"] = profile_data.get("reviewer_science_other")
                user_info["roles"] = profile_data.get("roles", [user.role])
                # Update organization from profile if it's more recent
                if profile_data.get("organization"):
                    user_info["organization"] = profile_data.get("organization")
    except Exception:
        # Fail-soft: return auth data even if profile service is unavailable
        pass

    identity = db.query(models.ExternalIdentity).filter(
        models.ExternalIdentity.provider == "orcid",
        models.ExternalIdentity.user_id == user.id,
    ).first()
    if identity:
        user_info["orcid"] = identity.provider_subject
        user_info["orcid_verified"] = True
    
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
                "academic_degrees": profile.get("academic_degrees", []),
                "orcid": profile.get("orcid"),
                "reviewer_science_fields": profile.get("reviewer_science_fields", []),
                "reviewer_science_other": profile.get("reviewer_science_other"),
                "roles": profile.get("roles", [user.role]),
                "profile_id": profile.get("id"),
                "is_council_member": profile.get("is_council_member"),
                "is_collegium_member": profile.get("is_collegium_member"),
            }
        )
    return result


@router.post("/admin/users", response_model=schemas.UserOut, status_code=201)
def create_admin_user(
    payload: schemas.AdminUserCreate,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    allowed_roles = {"author", "editor", "reviewer", "layout", "commission", "admin"}
    roles = list(dict.fromkeys(role.strip().lower() for role in payload.roles if role.strip()))
    if not roles or any(role not in allowed_roles for role in roles):
        raise HTTPException(status_code=400, detail="Invalid roles")

    username = payload.username.strip()
    email = str(payload.email).strip().lower()
    existing_username = db.query(models.User).filter(func.lower(models.User.username) == username.lower()).first()
    existing_email = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if existing_username or existing_email:
        raise build_registration_conflict_error(bool(existing_username), bool(existing_email))

    first_name = (payload.first_name or "").strip() or None
    last_name = (payload.last_name or "").strip() or None
    full_name = " ".join(part for part in [first_name, last_name] if part) or username
    user = models.User(
        username=username,
        email=email,
        hashed_password=security.hash_password(payload.password),
        role=roles[0],
        is_active=payload.is_active,
        full_name=full_name,
        first_name=first_name,
        last_name=last_name,
        organization=(payload.organization or "").strip() or None,
        institution=(payload.institution or "").strip() or None,
        accept_terms=False,
        notify_status=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.post(
                f"{config.USER_SERVICE_URL}/users/",
                json={
                    "user_id": user.id,
                    "full_name": full_name,
                    "roles": roles,
                    "organization": user.organization,
                    "phone": (payload.phone or "").strip() or None,
                    "preferred_language": "en",
                },
                headers={"X-Service-Secret": config.SHARED_SERVICE_SECRET},
            )
            response.raise_for_status()
    except Exception as exc:
        db.delete(user)
        db.commit()
        raise HTTPException(status_code=502, detail="Failed to create user profile") from exc
    return user


@router.patch("/admin/users/{user_id}/roles", response_model=schemas.UserOut)
def update_admin_user_roles(
    user_id: int,
    payload: schemas.AdminUserRolesUpdate,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    allowed_roles = {"author", "editor", "reviewer", "layout", "commission", "admin"}
    roles = list(dict.fromkeys(role.strip().lower() for role in payload.roles if role.strip()))
    if not roles or any(role not in allowed_roles for role in roles):
        raise HTTPException(status_code=400, detail="Invalid roles")
    if user_id == admin.id and "admin" not in roles:
        raise HTTPException(status_code=400, detail="You cannot remove your own administrator role")

    user = db.query(models.User).filter(models.User.id == user_id, models.User.is_hidden == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.patch(
                f"{config.USER_SERVICE_URL}/users/internal/{user_id}/roles",
                json={"roles": roles},
                headers={"X-Service-Secret": config.SHARED_SERVICE_SECRET},
            )
            response.raise_for_status()
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Failed to update profile roles") from exc

    if user.role not in roles:
        user.role = roles[0]
    if "admin" in roles:
        user.is_active = True
    db.commit()
    db.refresh(user)
    return user


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
        "academic_degrees": profile.get("academic_degrees", []),
        "orcid": profile.get("orcid"),
        "reviewer_science_fields": profile.get("reviewer_science_fields", []),
        "reviewer_science_other": profile.get("reviewer_science_other"),
        "roles": profile.get("roles", [user.role]),
        "profile_id": profile.get("id"),
        "is_council_member": profile.get("is_council_member"),
        "is_collegium_member": profile.get("is_collegium_member"),
    }


@router.patch("/admin/users/{user_id}", response_model=schemas.AdminUserDetail)
def update_admin_user(
    user_id: int,
    payload: schemas.AdminUserUpdate,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id, models.User.is_hidden == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    username = payload.username.strip()
    email = str(payload.email).strip().lower()
    if not username:
        raise HTTPException(status_code=400, detail={"fields": {"username": "Username is required"}})

    username_owner = db.query(models.User).filter(models.User.id != user_id, func.lower(models.User.username) == username.lower()).first()
    email_owner = db.query(models.User).filter(models.User.id != user_id, func.lower(models.User.email) == email).first()
    field_errors: dict[str, str] = {}
    if username_owner:
        field_errors["username"] = "A user with this username already exists"
    if email_owner:
        field_errors["email"] = "A user with this email already exists"
    if field_errors:
        raise HTTPException(status_code=400, detail={"message": "User data is not unique", "fields": field_errors})

    first_name = (payload.first_name or "").strip() or None
    last_name = (payload.last_name or "").strip() or None
    organization = (payload.organization or "").strip() or None
    institution = (payload.institution or "").strip() or None
    phone = (payload.phone or "").strip() or None
    full_name = " ".join(part for part in [first_name, last_name] if part) or username

    update_profile_contact(user_id, full_name, phone, organization)
    user.username = username
    user.email = email
    user.first_name = first_name
    user.last_name = last_name
    user.full_name = full_name
    user.organization = organization
    user.institution = institution
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username or email already exists")

    return get_admin_user_detail(user_id, admin, db)


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


def require_orcid_configuration() -> None:
    if not config.ORCID_CLIENT_ID or not config.ORCID_CLIENT_SECRET or not config.ORCID_REDIRECT_URI:
        raise HTTPException(status_code=503, detail="ORCID authentication is not configured")


def token_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def frontend_orcid_redirect(language: str | None, **params: str) -> str:
    prefix = f"/{language}" if language in {"ru", "en", "kz"} else ""
    return f"{config.FRONTEND_URL}{prefix}/login?{urlencode(params)}"


@router.get("/orcid/start", response_model=schemas.OAuthStartResponse)
def start_orcid_login(
    intent: str = "login",
    language: str | None = None,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    require_orcid_configuration()
    if intent not in {"login", "link"}:
        raise HTTPException(status_code=400, detail="Invalid ORCID intent")
    user_id = None
    if intent == "link":
        user_id = get_current_user_id(authorization)
        user = db.query(models.User).filter(
            models.User.id == user_id,
            models.User.is_hidden == False,
            models.User.is_active == True,
        ).first()
        if not user:
            raise HTTPException(status_code=403, detail="Active account required")

    raw_state = secrets.token_urlsafe(32)
    db.add(models.OAuthState(
        state_hash=token_hash(raw_state),
        provider="orcid",
        intent=intent,
        user_id=user_id,
        language=language if language in {"ru", "en", "kz"} else None,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    ))
    db.commit()
    query = urlencode({
        "client_id": config.ORCID_CLIENT_ID,
        "response_type": "code",
        "scope": "/authenticate",
        "redirect_uri": config.ORCID_REDIRECT_URI,
        "state": raw_state,
    })
    return {"authorization_url": f"{config.ORCID_BASE_URL}/oauth/authorize?{query}"}


@router.get("/orcid/callback")
def orcid_callback(
    state: str | None = None,
    code: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    from fastapi.responses import RedirectResponse

    require_orcid_configuration()
    if not state:
        return RedirectResponse(frontend_orcid_redirect(None, orcid_error="invalid_state"), status_code=303)
    oauth_state = db.query(models.OAuthState).filter(models.OAuthState.state_hash == token_hash(state)).first()
    if not oauth_state or oauth_state.used_at or oauth_state.expires_at < datetime.utcnow():
        return RedirectResponse(frontend_orcid_redirect(None, orcid_error="invalid_state"), status_code=303)
    oauth_state.used_at = datetime.utcnow()
    db.commit()
    if error or not code:
        return RedirectResponse(frontend_orcid_redirect(oauth_state.language, orcid_error="access_denied"), status_code=303)

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                f"{config.ORCID_BASE_URL}/oauth/token",
                data={
                    "client_id": config.ORCID_CLIENT_ID,
                    "client_secret": config.ORCID_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": config.ORCID_REDIRECT_URI,
                },
                headers={"Accept": "application/json"},
            )
        response.raise_for_status()
        token_data = response.json()
        orcid = normalize_orcid(token_data.get("orcid"))
        if not orcid:
            raise ValueError("ORCID token response did not contain an iD")
    except Exception:
        return RedirectResponse(frontend_orcid_redirect(oauth_state.language, orcid_error="token_exchange_failed"), status_code=303)

    identity = db.query(models.ExternalIdentity).filter(
        models.ExternalIdentity.provider == "orcid",
        models.ExternalIdentity.provider_subject == orcid,
    ).first()
    if oauth_state.intent == "link":
        if identity and identity.user_id != oauth_state.user_id:
            return RedirectResponse(f"{config.FRONTEND_URL}/cabinet/profile?orcid_error=already_linked", status_code=303)
        existing_for_user = db.query(models.ExternalIdentity).filter(
            models.ExternalIdentity.provider == "orcid",
            models.ExternalIdentity.user_id == oauth_state.user_id,
        ).first()
        if existing_for_user and existing_for_user.provider_subject != orcid:
            return RedirectResponse(f"{config.FRONTEND_URL}/cabinet/profile?orcid_error=different_orcid_linked", status_code=303)
        if not identity:
            db.add(models.ExternalIdentity(
                user_id=oauth_state.user_id,
                provider="orcid",
                provider_subject=orcid,
                display_name=token_data.get("name"),
            ))
            db.commit()
        try:
            sync_profile_orcid(oauth_state.user_id, orcid)
        except HTTPException:
            pass
        return RedirectResponse(f"{config.FRONTEND_URL}/cabinet/profile?orcid=linked", status_code=303)

    if not identity:
        return RedirectResponse(frontend_orcid_redirect(oauth_state.language, orcid_error="not_linked"), status_code=303)
    user = db.query(models.User).filter(
        models.User.id == identity.user_id,
        models.User.is_hidden == False,
    ).first()
    if not user or not user.is_active:
        return RedirectResponse(frontend_orcid_redirect(oauth_state.language, orcid_error="account_inactive"), status_code=303)
    raw_code = secrets.token_urlsafe(40)
    db.add(models.OAuthLoginCode(
        code_hash=token_hash(raw_code),
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(minutes=2),
    ))
    db.commit()
    return RedirectResponse(frontend_orcid_redirect(oauth_state.language, orcid_code=raw_code), status_code=303)


@router.post("/orcid/exchange", response_model=schemas.Token)
def exchange_orcid_login_code(payload: schemas.OAuthExchangeRequest, db: Session = Depends(get_db)):
    login_code = db.query(models.OAuthLoginCode).filter(
        models.OAuthLoginCode.code_hash == token_hash(payload.code),
    ).first()
    if not login_code or login_code.used_at or login_code.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired ORCID login code")
    user = db.query(models.User).filter(
        models.User.id == login_code.user_id,
        models.User.is_hidden == False,
        models.User.is_active == True,
    ).first()
    if not user:
        raise HTTPException(status_code=403, detail="Account inactive")
    login_code.used_at = datetime.utcnow()
    db.commit()
    return {
        "access_token": security.create_access_token({"sub": str(user.id), "roles": get_effective_roles(user.id, user.role)}),
        "refresh_token": security.create_refresh_token({"sub": str(user.id)}),
        "token_type": "bearer",
    }


@router.get("/orcid/status", response_model=schemas.OrcidStatusResponse)
def get_orcid_status(user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    identity = db.query(models.ExternalIdentity).filter(
        models.ExternalIdentity.provider == "orcid",
        models.ExternalIdentity.user_id == user.id,
    ).first()
    return {
        "linked": bool(identity),
        "orcid": identity.provider_subject if identity else None,
        "display_name": identity.display_name if identity else None,
        "linked_at": identity.linked_at.isoformat() if identity else None,
    }


@router.delete("/orcid/link", status_code=204)
def unlink_orcid(user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    identity = db.query(models.ExternalIdentity).filter(
        models.ExternalIdentity.provider == "orcid",
        models.ExternalIdentity.user_id == user.id,
    ).first()
    if identity:
        db.delete(identity)
        db.commit()
        try:
            sync_profile_orcid(user.id, None)
        except HTTPException:
            pass
    return None


@router.get("/internal/users/by-role", response_model=list[schemas.UserOut])
def get_active_users_by_role(
    role: str,
    x_service_secret: str | None = Header(default=None, alias="X-Service-Secret"),
    db: Session = Depends(get_db),
):
    """Return active, visible users of a role to trusted internal services."""
    if not x_service_secret or x_service_secret != config.SHARED_SERVICE_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    if role not in {"author", "editor", "reviewer", "layout", "commission", "admin"}:
        raise HTTPException(status_code=422, detail="Unsupported role")
    return (
        db.query(models.User)
        .filter(
            models.User.role == role,
            models.User.is_active.is_(True),
            models.User.is_hidden.is_(False),
        )
        .order_by(models.User.id.asc())
        .all()
    )


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

    allowed_roles = {"author", "editor", "reviewer", "layout", "commission", "admin"}
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
