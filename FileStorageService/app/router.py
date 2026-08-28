import os
from io import BytesIO
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app import database, models, schemas, config

try:
    from PIL import Image, ImageOps, UnidentifiedImageError
except ImportError:  # pragma: no cover - dependency is installed in Docker image
    Image = ImageOps = UnidentifiedImageError = None

router = APIRouter(prefix="/files", tags=["files"])

IMAGE_MAX_SIDE = 1600
IMAGE_WEBP_QUALITY = 82
IMAGE_WEBP_METHOD = 6
SKIP_IMAGE_TYPES = {"image/gif", "image/svg+xml"}


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _ensure_storage_dir():
    os.makedirs(config.STORAGE_PATH, exist_ok=True)


def _is_compressible_image(upload: UploadFile) -> bool:
    content_type = (upload.content_type or "").lower()
    if content_type in SKIP_IMAGE_TYPES:
        return False
    if content_type.startswith("image/"):
        return True

    extension = os.path.splitext(upload.filename or "")[1].lower()
    return extension in {".jpg", ".jpeg", ".png", ".webp"}


def _webp_original_name(filename: str | None) -> str:
    stem = os.path.splitext(filename or "image")[0] or "image"
    return f"{stem}.webp"


async def _read_upload(upload: UploadFile) -> bytes:
    data = bytearray()
    while True:
        chunk = await upload.read(1024 * 1024)
        if not chunk:
            break
        data.extend(chunk)
    return bytes(data)


async def _save_upload_stream(upload: UploadFile, dest_path: str) -> int:
    size = 0
    with open(dest_path, "wb") as out_file:
        while True:
            chunk = await upload.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            out_file.write(chunk)
    return size


def _compress_image(raw: bytes) -> bytes | None:
    if Image is None or ImageOps is None or UnidentifiedImageError is None:
        return None

    try:
        with Image.open(BytesIO(raw)) as image:
            image = ImageOps.exif_transpose(image)
            image.thumbnail((IMAGE_MAX_SIDE, IMAGE_MAX_SIDE), Image.Resampling.LANCZOS)

            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGBA" if "A" in image.getbands() else "RGB")

            output = BytesIO()
            image.save(
                output,
                format="WEBP",
                quality=IMAGE_WEBP_QUALITY,
                method=IMAGE_WEBP_METHOD,
            )
            return output.getvalue()
    except (UnidentifiedImageError, OSError, ValueError):
        return None


@router.post("/", response_model=schemas.FileOut)
async def upload_file(upload: UploadFile = File(...), db: Session = Depends(get_db)):
    _ensure_storage_dir()
    file_id = str(uuid.uuid4())

    original_name = upload.filename
    content_type = upload.content_type
    if _is_compressible_image(upload):
        raw = await _read_upload(upload)
        data = _compress_image(raw)
        if data is not None:
            original_name = _webp_original_name(upload.filename)
            content_type = "image/webp"
            stored_name = f"{file_id}.webp"
            dest_path = os.path.join(config.STORAGE_PATH, stored_name)
            with open(dest_path, "wb") as out_file:
                out_file.write(data)
            size = len(data)
        else:
            extension = os.path.splitext(upload.filename or "")[1]
            stored_name = f"{file_id}{extension}"
            dest_path = os.path.join(config.STORAGE_PATH, stored_name)
            with open(dest_path, "wb") as out_file:
                out_file.write(raw)
            size = len(raw)
    else:
        extension = os.path.splitext(upload.filename or "")[1]
        stored_name = f"{file_id}{extension}"
        dest_path = os.path.join(config.STORAGE_PATH, stored_name)
        size = await _save_upload_stream(upload, dest_path)

    record = models.StoredFile(
        id=file_id,
        original_name=original_name,
        stored_name=stored_name,
        content_type=content_type,
        size_bytes=size,
        path=dest_path,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return schemas.FileOut(
        id=record.id,
        original_name=record.original_name,
        content_type=record.content_type,
        size_bytes=record.size_bytes,
        url=f"/files/{record.id}/download",
        created_at=record.created_at,
    )


@router.get("/", response_model=list[schemas.FileOut])
def list_files(db: Session = Depends(get_db)):
    files = db.query(models.StoredFile).order_by(models.StoredFile.created_at.desc()).all()
    return [
        schemas.FileOut(
            id=f.id,
            original_name=f.original_name,
            content_type=f.content_type,
            size_bytes=f.size_bytes,
            url=f"/files/{f.id}/download",
            created_at=f.created_at,
        )
        for f in files
    ]


@router.get("/{file_id}", response_model=schemas.FileOut)
def get_file(file_id: str, db: Session = Depends(get_db)):
    file_obj = db.query(models.StoredFile).filter(models.StoredFile.id == file_id).first()
    if not file_obj:
        raise HTTPException(status_code=404, detail="File not found")
    return schemas.FileOut(
        id=file_obj.id,
        original_name=file_obj.original_name,
        content_type=file_obj.content_type,
        size_bytes=file_obj.size_bytes,
        url=f"/files/{file_obj.id}/download",
        created_at=file_obj.created_at,
    )


@router.get("/{file_id}/download")
def download_file(file_id: str, db: Session = Depends(get_db)):
    file_obj = db.query(models.StoredFile).filter(models.StoredFile.id == file_id).first()
    if not file_obj:
        raise HTTPException(status_code=404, detail="File not found")
    if not os.path.exists(file_obj.path):
        raise HTTPException(status_code=410, detail="File content missing")
    return FileResponse(
        path=file_obj.path,
        media_type=file_obj.content_type or "application/octet-stream",
        filename=file_obj.original_name,
    )


@router.get("/{file_id}/view")
def view_file(file_id: str, db: Session = Depends(get_db)):
    file_obj = db.query(models.StoredFile).filter(models.StoredFile.id == file_id).first()
    if not file_obj:
        raise HTTPException(status_code=404, detail="File not found")
    if not os.path.exists(file_obj.path):
        raise HTTPException(status_code=410, detail="File content missing")
    return FileResponse(
        path=file_obj.path,
        media_type=file_obj.content_type or "application/octet-stream",
        filename=file_obj.original_name,
        content_disposition_type="inline",
    )


@router.delete("/{file_id}")
def delete_file(file_id: str, db: Session = Depends(get_db)):
    file_obj = db.query(models.StoredFile).filter(models.StoredFile.id == file_id).first()
    if not file_obj:
        raise HTTPException(status_code=404, detail="File not found")
    # Remove file content if present
    try:
        if os.path.exists(file_obj.path):
            os.remove(file_obj.path)
    finally:
        db.delete(file_obj)
        db.commit()
    return {"status": "deleted", "id": file_id}
