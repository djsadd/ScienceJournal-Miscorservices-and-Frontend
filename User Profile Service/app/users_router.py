from fastapi import APIRouter, Body, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from app import models, schemas, database, security
from app import config
import httpx

router = APIRouter(prefix="/users", tags=["users"])

ALLOWED_ROLES = {"author", "reviewer", "editor", "layout", "admin"}
ALLOWED_SELF_REQUEST_ROLES = {"author", "reviewer", "editor", "layout"}
ROLE_REQUEST_PENDING_STATUSES = {"pending", "pending_editor", "pending_admin"}

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
ALLOWED_REVIEW_LANGUAGES = {item.value for item in schemas.Language}


def normalize_preferred_language(value: str | list[str] | None) -> str | None:
    if value is None:
        return None
    if isinstance(value, list):
        raw_items = value
    elif isinstance(value, str):
        raw_items = value.split(",")
    else:
        return None

    normalized: list[str] = []
    for item in raw_items:
        if not isinstance(item, str):
            continue
        candidate = item.strip()
        if not candidate:
            continue
        if candidate not in ALLOWED_REVIEW_LANGUAGES:
            raise HTTPException(status_code=400, detail="Invalid preferred language")
        if candidate in normalized:
            continue
        normalized.append(candidate)

    return ",".join(normalized) or None


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
            raise HTTPException(status_code=400, detail="Invalid academic degree")
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
        raise HTTPException(status_code=400, detail="Invalid ORCID format")
    return normalized

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(request: Request, authorization: str = Header(None)):
    """Resolve current user using data forwarded by API gateway.

    Gateway is expected to validate JWT and pass X-User-Id / X-User-Roles headers.
    For direct calls (e.g. local testing), fall back to JWT decoding from Authorization.
    """
    # Preferred path: trust identity forwarded by API gateway
    forwarded_user_id = request.headers.get("X-User-Id")
    if forwarded_user_id:
        roles_header = request.headers.get("X-User-Roles", "")
        roles = [r for r in roles_header.split(",") if r] if roles_header else []
        try:
            return {"user_id": int(forwarded_user_id), "roles": roles}
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid forwarded user id")

    # Fallback: decode JWT locally for direct access (non-gateway)
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    parts = authorization.split()
    if len(parts) != 2:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    scheme, token = parts
    if scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization scheme")

    from app.config import SECRET_KEY, ALGORITHM
    from jose import jwt, JWTError

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        roles = payload.get("roles", [])
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": int(user_id), "roles": roles}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def ensure_service_secret(x_service_secret: str | None):
    if not x_service_secret or x_service_secret != getattr(config, "SHARED_SERVICE_SECRET", ""):
        raise HTTPException(status_code=403, detail="Invalid service secret")


def normalize_role(value: str) -> str:
    role = (value or "").strip().lower()
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    return role


def ensure_unique_roles(roles: list[str] | None) -> list[str]:
    normalized: list[str] = []
    for role in roles or []:
        if not isinstance(role, str):
            continue
        candidate = role.strip().lower()
        if candidate in ALLOWED_ROLES and candidate not in normalized:
            normalized.append(candidate)
    return normalized or ["author"]


def role_request_to_out(role_request: models.RoleRequest, profile: models.UserProfile | None = None) -> dict:
    return {
        "id": role_request.id,
        "user_id": role_request.user_id,
        "full_name": profile.full_name if profile else None,
        "organization": profile.organization if profile else None,
        "current_roles": (profile.roles or []) if profile else [],
        "requested_role": role_request.requested_role,
        "status": role_request.status,
        "editor_approved": role_request.editor_approved,
        "admin_approved": role_request.admin_approved,
        "editor_approved_by": role_request.editor_approved_by,
        "admin_approved_by": role_request.admin_approved_by,
        "rejected_by": role_request.rejected_by,
        "rejection_reason": role_request.rejection_reason,
        "created_at": role_request.created_at.isoformat() if role_request.created_at else None,
        "updated_at": role_request.updated_at.isoformat() if role_request.updated_at else None,
    }


def approve_role_if_complete(role_request: models.RoleRequest, profile: models.UserProfile) -> None:
    if not role_request.editor_approved or not role_request.admin_approved:
        role_request.status = "pending_admin" if role_request.editor_approved else "pending_editor"
        return

    roles = ensure_unique_roles(profile.roles)
    if role_request.requested_role not in roles:
        roles.append(role_request.requested_role)
    profile.roles = roles
    role_request.status = "approved"


@router.post("/", response_model=schemas.UserProfileOut)
def create_profile(
    profile: schemas.UserProfileCreate,
    x_service_secret: str | None = Header(default=None, alias="X-Service-Secret"),
    db: Session = Depends(get_db),
):
    ensure_service_secret(x_service_secret)
    db_profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == profile.user_id).first()
    if db_profile:
        raise HTTPException(status_code=400, detail="Profile already exists")
    payload = profile.dict()
    payload["preferred_language"] = normalize_preferred_language(payload.get("preferred_language")) or schemas.Language.en.value
    payload["academic_degrees"] = normalize_academic_degrees(payload.get("academic_degrees"))
    payload["orcid"] = normalize_orcid(payload.get("orcid"))
    payload["reviewer_science_fields"] = normalize_reviewer_science_fields(payload.get("reviewer_science_fields"))
    payload["reviewer_science_other"] = normalize_reviewer_science_other(payload.get("reviewer_science_other"))
    new_profile = models.UserProfile(**payload)
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile


@router.get("/me/roles", response_model=schemas.UserRolesOut)
async def get_user_roles(current=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current["user_id"]
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"user_id": user_id, "roles": profile.roles or [], "preferred_language": profile.preferred_language}


@router.post("/me/role-requests", response_model=schemas.RoleRequestOut)
async def request_role_for_me(
    payload: schemas.RoleRequestCreate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current["user_id"]
    requested_role = normalize_role(payload.role)
    if requested_role not in ALLOWED_SELF_REQUEST_ROLES:
        raise HTTPException(status_code=403, detail="This role cannot be requested")

    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    roles = ensure_unique_roles(profile.roles)
    if requested_role in roles:
        raise HTTPException(status_code=409, detail="Role already assigned")

    if requested_role == "author":
        roles.append("author")
        profile.roles = ensure_unique_roles(roles)
        role_request = models.RoleRequest(
            user_id=user_id,
            requested_role=requested_role,
            status="approved",
            editor_approved=True,
            admin_approved=True,
        )
        db.add(role_request)
        db.commit()
        db.refresh(role_request)
        db.refresh(profile)
        return role_request_to_out(role_request, profile)

    existing = (
        db.query(models.RoleRequest)
        .filter(
            models.RoleRequest.user_id == user_id,
            models.RoleRequest.requested_role == requested_role,
            models.RoleRequest.status.in_(ROLE_REQUEST_PENDING_STATUSES),
        )
        .order_by(models.RoleRequest.id.desc())
        .first()
    )
    if existing:
        return role_request_to_out(existing, profile)

    role_request = models.RoleRequest(
        user_id=user_id,
        requested_role=requested_role,
        status="pending_editor",
    )
    db.add(role_request)
    db.commit()
    db.refresh(role_request)
    return role_request_to_out(role_request, profile)


@router.get("/me/role-requests", response_model=list[schemas.RoleRequestOut])
async def get_my_role_requests(current=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current["user_id"]
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    rows = (
        db.query(models.RoleRequest)
        .filter(models.RoleRequest.user_id == user_id)
        .order_by(models.RoleRequest.id.desc())
        .all()
    )
    return [role_request_to_out(row, profile) for row in rows]


@router.get("/role-requests", response_model=list[schemas.RoleRequestOut])
async def get_role_requests(
    status: str | None = None,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    roles = current.get("roles", [])
    if "editor" not in roles and "admin" not in roles:
        raise HTTPException(status_code=403, detail="Editor or admin role required")

    query = db.query(models.RoleRequest)
    if status:
        query = query.filter(models.RoleRequest.status == status)
    elif "admin" not in roles:
        query = query.filter(models.RoleRequest.status.in_(ROLE_REQUEST_PENDING_STATUSES))

    rows = query.order_by(models.RoleRequest.id.desc()).all()
    profiles = {
        profile.user_id: profile
        for profile in db.query(models.UserProfile)
        .filter(models.UserProfile.user_id.in_([row.user_id for row in rows] or [-1]))
        .all()
    }
    return [role_request_to_out(row, profiles.get(row.user_id)) for row in rows]


@router.patch("/role-requests/{request_id}/decision", response_model=schemas.RoleRequestOut)
async def decide_role_request(
    request_id: int,
    payload: schemas.RoleRequestDecision,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_roles = current.get("roles", [])
    stage = (payload.stage or "").strip().lower()
    decision = (payload.decision or "").strip().lower()
    if stage not in {"editor", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid approval stage")
    if decision not in {"approve", "reject"}:
        raise HTTPException(status_code=400, detail="Invalid decision")
    if stage == "editor" and "editor" not in current_roles and "admin" not in current_roles:
        raise HTTPException(status_code=403, detail="Editor role required")
    if stage == "admin" and "admin" not in current_roles:
        raise HTTPException(status_code=403, detail="Admin role required")

    role_request = db.query(models.RoleRequest).filter(models.RoleRequest.id == request_id).first()
    if not role_request:
        raise HTTPException(status_code=404, detail="Role request not found")
    if role_request.status not in ROLE_REQUEST_PENDING_STATUSES:
        raise HTTPException(status_code=409, detail="Role request is already closed")

    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == role_request.user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    actor_id = current["user_id"]
    if decision == "reject":
        role_request.status = "rejected"
        role_request.rejected_by = actor_id
        role_request.rejection_reason = (payload.reason or "").strip() or None
    elif stage == "editor":
        role_request.editor_approved = True
        role_request.editor_approved_by = actor_id
        approve_role_if_complete(role_request, profile)
    else:
        role_request.admin_approved = True
        role_request.admin_approved_by = actor_id
        approve_role_if_complete(role_request, profile)

    db.commit()
    db.refresh(role_request)
    db.refresh(profile)
    return role_request_to_out(role_request, profile)


@router.patch("/me/language", response_model=schemas.UserProfileOut)
async def update_language(
    payload: schemas.UserLanguageUpdate | None = Body(default=None),
    preferred_language: str | None = None,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current["user_id"]
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    normalized = normalize_preferred_language(payload.preferred_language if payload else preferred_language)
    if not normalized:
        raise HTTPException(status_code=400, detail="Select at least one preferred language")
    profile.preferred_language = normalized
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/reviewers", response_model=list[schemas.ReviewerFullInfo])
def get_reviewers(
    db: Session = Depends(get_db),
    language: str | None = None,
    current=Depends(get_current_user),
):
    """
    Получить список всех рецензентов (пользователей с ролью 'reviewer').
    Возвращает полную информацию, обогащённую данными из Auth-сервиса.
    Опциональная фильтрация по предпочитаемому языку.
    Доступно только для роли 'editor'.
    """
    # Проверка роли
    roles = current.get("roles", [])
    if "editor" not in roles and "admin" not in roles:
        raise HTTPException(status_code=403, detail="Editor role required")

    # Use ARRAY any() to avoid Postgres casting issues (text[] vs varchar[])
    query = db.query(models.UserProfile).filter(models.UserProfile.roles.any("reviewer"))

    if language:
        query = query.filter(models.UserProfile.preferred_language.contains(language))

    reviewers = query.all()

    enriched: list[dict] = []
    with httpx.Client(timeout=5.0) as client:
        for reviewer in reviewers:
            item = {
                "id": reviewer.id,
                "user_id": reviewer.user_id,
                "full_name": reviewer.full_name,
                "phone": reviewer.phone,
                "organization": reviewer.organization,
                "roles": reviewer.roles or [],
                "preferred_language": reviewer.preferred_language,
                "academic_degrees": reviewer.academic_degrees or [],
                "orcid": reviewer.orcid,
                "reviewer_science_fields": reviewer.reviewer_science_fields or [],
                "reviewer_science_other": reviewer.reviewer_science_other,
                "is_active": reviewer.is_active,
                "is_council_member": reviewer.is_council_member,
                "is_collegium_member": reviewer.is_collegium_member,
                # defaults for auth data
                "username": None,
                "email": None,
                "first_name": None,
                "last_name": None,
                "institution": None,
            }
            try:
                auth_resp = client.get(f"{config.AUTH_SERVICE_URL}/auth/users/{reviewer.user_id}")
                if auth_resp.status_code == 200:
                    auth_data = auth_resp.json()
                    item.update({
                        "username": auth_data.get("username"),
                        "email": auth_data.get("email"),
                        "first_name": auth_data.get("first_name"),
                        "last_name": auth_data.get("last_name"),
                        "institution": auth_data.get("institution"),
                        # prefer is_active from auth if present
                        "is_active": auth_data.get("is_active", item["is_active"]),
                    })
                    # если в профиле нет organization, возьмём из auth
                    if not item.get("organization") and auth_data.get("organization"):
                        item["organization"] = auth_data.get("organization")
            except Exception:
                # fail-soft: отдаём профиль без auth-данных
                pass
            enriched.append(item)

    return enriched


@router.get("/internal/editors/ids", response_model=list[int])
def get_editor_ids_internal(
    x_service_secret: str | None = Header(default=None, alias="X-Service-Secret"),
    db: Session = Depends(get_db),
):
    """Internal endpoint: returns user_ids of all editors.

    Protected by X-Service-Secret. Intended for internal service-to-service calls.
    """
    ensure_service_secret(x_service_secret)

    # Filter roles array by 'editor'
    query = db.query(models.UserProfile).filter(models.UserProfile.roles.any("editor"))
    rows = query.all()
    return [row.user_id for row in rows if row.user_id is not None]


@router.get("/internal/profiles", response_model=list[schemas.UserProfileOut])
def get_profiles_internal(
    x_service_secret: str | None = Header(default=None, alias="X-Service-Secret"),
    db: Session = Depends(get_db),
):
    ensure_service_secret(x_service_secret)
    return db.query(models.UserProfile).all()


@router.patch("/internal/{user_id}/roles", response_model=schemas.UserProfileOut)
def update_profile_roles_internal(
    user_id: int,
    payload: schemas.UserRolesUpdate,
    x_service_secret: str | None = Header(default=None, alias="X-Service-Secret"),
    db: Session = Depends(get_db),
):
    ensure_service_secret(x_service_secret)
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile.roles = ensure_unique_roles(payload.roles)
    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/me/contact", response_model=schemas.UserProfileOut)
async def update_my_contact_profile(
    payload: schemas.UserContactProfileUpdate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current["user_id"]
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    full_name = (payload.full_name or "").strip()
    if full_name:
        profile.full_name = full_name
    profile.phone = (payload.phone or "").strip() or None
    profile.organization = (payload.organization or "").strip() or None

    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/me/details", response_model=schemas.UserProfileOut)
async def update_my_details(
    payload: schemas.UserAcademicProfileUpdate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current["user_id"]
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile.academic_degrees = normalize_academic_degrees(payload.academic_degrees)
    profile.orcid = normalize_orcid(payload.orcid)
    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/me/reviewer-science", response_model=schemas.UserProfileOut)
async def update_reviewer_science(
    payload: schemas.ReviewerScienceUpdate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current["user_id"]
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if "reviewer" not in (profile.roles or []):
        raise HTTPException(status_code=403, detail="Reviewer role required")

    fields = normalize_reviewer_science_fields(payload.reviewer_science_fields)
    other = normalize_reviewer_science_other(payload.reviewer_science_other)

    if not fields:
        raise HTTPException(status_code=400, detail="Select at least one science field")
    if "other" in fields and not other:
        raise HTTPException(status_code=400, detail="Fill in the 'other' science field")
    if "other" not in fields:
        other = None

    profile.reviewer_science_fields = fields
    profile.reviewer_science_other = other
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/{user_id}", response_model=schemas.UserProfileOut)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
