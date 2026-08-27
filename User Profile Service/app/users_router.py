from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from app import models, schemas, database, security
from app import config
import httpx

router = APIRouter(prefix="/users", tags=["users"])

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


@router.patch("/me/language", response_model=schemas.UserProfileOut)
async def update_language(preferred_language: schemas.Language, current=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current["user_id"]
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile.preferred_language = preferred_language.value
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
    profile.roles = payload.roles or ["author"]
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
