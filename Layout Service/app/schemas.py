from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class LayoutRecordBase(BaseModel):
    article_id: Optional[int] = None
    volume_id: Optional[int] = None
    file_id: Optional[str] = None
    file_url: Optional[str] = None


class LayoutRecordCreate(LayoutRecordBase):
    pass


class LayoutRecordUpdate(BaseModel):
    article_id: Optional[int] = None
    volume_id: Optional[int] = None
    file_id: Optional[str] = None
    file_url: Optional[str] = None


class LayoutRecordOut(LayoutRecordBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
