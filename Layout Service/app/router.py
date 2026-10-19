from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from jose import jwt, JWTError
import httpx
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app import config, database, models, schemas

router = APIRouter(prefix="/layout", tags=["layout"])


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    try:
        payload = jwt.decode(authorization[7:], config.SECRET_KEY, algorithms=[config.ALGORITHM])
        roles = payload.get("roles") or []
        if isinstance(roles, str):
            roles = [roles]
        return {"user_id": int(payload["sub"]), "roles": roles}
    except (JWTError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")


def require_role(user: dict, *roles: str):
    if not set(roles).intersection(user.get("roles", [])):
        raise HTTPException(status_code=403, detail=f"One of these roles is required: {', '.join(roles)}")


def notify_editor(task: models.LayoutTask) -> None:
    try:
        with httpx.Client(timeout=5.0) as client:
            client.post(
                f"{config.NOTIFICATIONS_SERVICE_URL}/notifications/internal",
                headers={"X-Service-Secret": config.SHARED_SERVICE_SECRET},
                json={
                    "user_id": task.editor_id,
                    "type": "editorial",
                    "title": "Вёрстка завершена",
                    "message": f"Верстальщик завершил вёрстку материала «{task.article_title}».",
                    "related_entity": f"layout_task:{task.id}",
                    "article_id": task.article_id,
                },
            )
    except Exception:
        # Completion must remain successful if the optional notification channel is down.
        pass


@router.post("/tasks", response_model=schemas.LayoutTaskOut, status_code=201)
def create_task(
    payload: schemas.LayoutTaskCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    require_role(current_user, "editor", "admin")
    existing = db.query(models.LayoutTask).filter(
        models.LayoutTask.article_id == payload.article_id,
        models.LayoutTask.status.in_(["pending", "in_progress"]),
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Article already has an active layout task")
    task = models.LayoutTask(
        article_id=payload.article_id,
        article_title=payload.article_title.strip() or f"Материал #{payload.article_id}",
        editor_id=current_user["user_id"],
        source_file_id=payload.source_file_id,
        source_file_url=payload.source_file_url,
        instructions=payload.instructions,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/tasks", response_model=List[schemas.LayoutTaskOut])
def list_tasks(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    roles = set(current_user.get("roles", []))
    query = db.query(models.LayoutTask)
    if "admin" not in roles:
        if "layout" in roles:
            query = query.filter(or_(
                models.LayoutTask.status == "pending",
                models.LayoutTask.layout_user_id == current_user["user_id"],
            ))
        elif "editor" in roles:
            query = query.filter(models.LayoutTask.editor_id == current_user["user_id"])
        else:
            raise HTTPException(status_code=403, detail="Layout or editor role required")
    return query.order_by(models.LayoutTask.created_at.desc()).all()


@router.post("/tasks/{task_id}/claim", response_model=schemas.LayoutTaskOut)
def claim_task(task_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_role(current_user, "layout", "admin")
    task = db.query(models.LayoutTask).filter(models.LayoutTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Layout task not found")
    if task.layout_user_id not in (None, current_user["user_id"]):
        raise HTTPException(status_code=409, detail="Layout task is already assigned")
    if task.status == "completed":
        raise HTTPException(status_code=409, detail="Layout task is already completed")
    task.layout_user_id = current_user["user_id"]
    task.status = "in_progress"
    db.commit()
    db.refresh(task)
    return task


@router.post("/tasks/{task_id}/complete", response_model=schemas.LayoutTaskOut)
def complete_task(
    task_id: str,
    payload: schemas.LayoutTaskComplete,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    require_role(current_user, "layout", "admin")
    task = db.query(models.LayoutTask).filter(models.LayoutTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Layout task not found")
    if task.status == "completed":
        raise HTTPException(status_code=409, detail="Layout task is already completed")
    if task.layout_user_id not in (None, current_user["user_id"]):
        raise HTTPException(status_code=403, detail="Layout task belongs to another user")
    record = models.LayoutRecord(
        article_id=task.article_id,
        file_id=payload.file_id,
        file_url=payload.file_url,
    )
    db.add(record)
    db.flush()
    task.layout_user_id = current_user["user_id"]
    task.status = "completed"
    task.result_record_id = record.id
    task.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    notify_editor(task)
    return task


@router.post("/records", response_model=schemas.LayoutRecordOut)
async def create_record(payload: schemas.LayoutRecordCreate, db: Session = Depends(get_db)):
    record = models.LayoutRecord(
        article_id=payload.article_id,
        volume_id=payload.volume_id,
        file_id=payload.file_id,
        file_url=payload.file_url,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/records/{record_id}", response_model=schemas.LayoutRecordOut)
async def get_record(record_id: str, db: Session = Depends(get_db)):
    record = db.query(models.LayoutRecord).filter(models.LayoutRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.get("/articles/{article_id}/records", response_model=List[schemas.LayoutRecordOut])
async def list_article_records(article_id: int, db: Session = Depends(get_db)):
    records = (
        db.query(models.LayoutRecord)
        .filter(models.LayoutRecord.article_id == article_id)
        .order_by(models.LayoutRecord.created_at.desc())
        .all()
    )
    return records


@router.get("/volumes/{volume_id}/records", response_model=List[schemas.LayoutRecordOut])
async def list_volume_records(volume_id: int, db: Session = Depends(get_db)):
    records = (
        db.query(models.LayoutRecord)
        .filter(models.LayoutRecord.volume_id == volume_id)
        .order_by(models.LayoutRecord.created_at.desc())
        .all()
    )
    return records


@router.patch("/records/{record_id}", response_model=schemas.LayoutRecordOut)
async def update_record(record_id: str, payload: schemas.LayoutRecordUpdate, db: Session = Depends(get_db)):
    record = db.query(models.LayoutRecord).filter(models.LayoutRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if payload.article_id is not None:
        record.article_id = payload.article_id
    if payload.volume_id is not None:
        record.volume_id = payload.volume_id
    if payload.file_id is not None:
        record.file_id = payload.file_id
    if payload.file_url is not None:
        record.file_url = payload.file_url
    db.commit()
    db.refresh(record)
    return record


@router.delete("/records/{record_id}")
async def delete_record(record_id: str, db: Session = Depends(get_db)):
    record = db.query(models.LayoutRecord).filter(models.LayoutRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return {"status": "deleted", "id": record_id}
