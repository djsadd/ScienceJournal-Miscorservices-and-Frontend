from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
import httpx
from jose import jwt, JWTError
from app import models, schemas, database, security, config

router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter((models.User.username == user.username) | (models.User.email == user.email)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    hashed_password = security.hash_password(user.password)
    
    # Require email verification for all roles - set is_active to False until confirmed
    is_active = False
    
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
            "phone": None,
        }
        with httpx.Client(timeout=5.0) as client:
            # Call users service with trailing slash to avoid FastAPI 307 redirect
            client.post(f"{config.USER_SERVICE_URL}/users/", json=profile_payload)
    except Exception:
        # Fail-soft: auth registration succeeds even if profile call fails
        pass

    # Create notification (and email) via Notification Service with verification link
    try:
        # issue email verification token (JWT signed)
        verify_token = security.create_access_token({"sub": str(new_user.id), "purpose": "email_verify"})
        verify_link = f"http://localhost:8001/auth/verify-email?token={verify_token}"
        notify_payload = {
            "user_id": new_user.id,
            "type": "system",
            "title": "Подтверждение электронной почты",
            "message": (
                "Вы успешно зарегистрированы в ScienceJournal. "
                "Для активации аккаунта подтвердите эл. почту по ссылке: "
                f"{verify_link}"
            ),
            "related_entity": f"auth:register:{new_user.id}",
        }
        with httpx.Client(timeout=5.0) as client:
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

    # Activate user upon successful verification
    user.is_active = True
    db.commit()
    return {"status": "verified", "user_id": user.id}

@router.post("/login", response_model=schemas.Token)
def login(form_data: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=403, 
            detail="Account is pending approval. Please wait for administrator confirmation."
        )
    
    # JWT spec expects `sub` to be a string; cast user.id accordingly
    access_token = security.create_access_token({"sub": str(user.id), "roles": [user.role]})
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
    access_token = security.create_access_token({"sub": str(user.id), "roles": [user.role]})
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
        "accept_terms": user.accept_terms,
        "notify_status": user.notify_status,
        "profile_id": None,
        "phone": None,
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
        models.User.is_active == False,
        models.User.role.in_(["editor", "reviewer"])
    ).all()
    return pending_users


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
    
    user.is_active = activation.is_active
    db.commit()
    db.refresh(user)
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

    allowed_roles = {"author", "editor", "reviewer", "layout", "admin"}
    if role_update.role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Invalid role")

    user.role = role_update.role
    # If promoting to admin, ensure active
    if user.role == "admin":
        user.is_active = True
    db.commit()
    db.refresh(user)
    return user
