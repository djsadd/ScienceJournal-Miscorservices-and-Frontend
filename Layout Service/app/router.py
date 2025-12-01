from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import database, models, schemas

router = APIRouter(prefix="/layout", tags=["layout"])


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
