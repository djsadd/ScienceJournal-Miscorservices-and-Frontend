import json
import os
import shutil
import tempfile
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr

app = FastAPI(title="Publication Service")

DATA_DIR = Path(os.getenv("PUBLICATION_DATA_DIR", "/app/data"))
SETTINGS_FILE = DATA_DIR / "journal-settings.json"
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
LANGUAGES = {"ru", "kz", "en"}

DEFAULT_SETTINGS = {
    "editor_name": "Доценко А.Н.",
    "editor_email": "zharshy@tau-edu.kz",
    "phone": "+7 (7172) 64-43-10",
    "address": "г. Астана, пр. Ықылас Дүкенұлы, 29, Университет Туран-Астана",
    "contact_email": "zharshy@tau-edu.kz",
}


class JournalSettings(BaseModel):
    editor_name: str
    editor_email: EmailStr
    phone: str
    address: str
    contact_email: EmailStr


def ensure_storage() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def read_settings() -> dict:
    ensure_storage()
    if not SETTINGS_FILE.exists():
        return DEFAULT_SETTINGS.copy()
    try:
        return {**DEFAULT_SETTINGS, **json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))}
    except (OSError, ValueError, TypeError):
        return DEFAULT_SETTINGS.copy()


def require_admin(authorization: str | None = Header(default=None)) -> None:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        payload = jwt.decode(authorization.split(" ", 1)[1], SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid access token") from exc
    if "admin" not in payload.get("roles", []):
        raise HTTPException(status_code=403, detail="Administrator role required")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/publication/journal-settings")
async def get_journal_settings():
    settings = read_settings()
    settings["requirements"] = {
        lang: (DATA_DIR / f"requirements-{lang}.pdf").exists() for lang in LANGUAGES
    }
    return settings


@app.put("/publication/journal-settings", dependencies=[Depends(require_admin)])
async def update_journal_settings(settings: JournalSettings):
    ensure_storage()
    SETTINGS_FILE.write_text(
        json.dumps(settings.model_dump(mode="json"), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return await get_journal_settings()


@app.put("/publication/journal-settings/requirements/{lang}", dependencies=[Depends(require_admin)])
async def upload_requirements(lang: Literal["ru", "kz", "en"], document: UploadFile = File(...)):
    if document.content_type != "application/pdf" and not (document.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    ensure_storage()
    target = DATA_DIR / f"requirements-{lang}.pdf"
    with tempfile.NamedTemporaryFile(dir=DATA_DIR, delete=False) as temporary:
        shutil.copyfileobj(document.file, temporary)
        temporary_path = Path(temporary.name)
    file_size = temporary_path.stat().st_size
    with temporary_path.open("rb") as uploaded:
        is_pdf = uploaded.read(5) == b"%PDF-"
    if not is_pdf:
        temporary_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid PDF")
    if file_size > 25 * 1024 * 1024:
        temporary_path.unlink(missing_ok=True)
        raise HTTPException(status_code=413, detail="PDF file must not exceed 25 MB")
    temporary_path.replace(target)
    return {"language": lang, "filename": document.filename, "available": True}


@app.get("/publication/journal-settings/requirements/{lang}")
async def view_requirements(lang: Literal["ru", "kz", "en"]):
    target = DATA_DIR / f"requirements-{lang}.pdf"
    if not target.exists():
        raise HTTPException(status_code=404, detail="Requirements PDF is not uploaded")
    return FileResponse(target, media_type="application/pdf", headers={"Content-Disposition": "inline"})
