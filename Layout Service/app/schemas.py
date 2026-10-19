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


class LayoutTaskCreate(BaseModel):
    article_id: int
    article_title: str
    source_file_id: Optional[str] = None
    source_file_url: Optional[str] = None
    instructions: Optional[str] = None


class LayoutTaskComplete(BaseModel):
    file_id: str
    file_url: Optional[str] = None


class LayoutTaskOut(BaseModel):
    id: str
    article_id: int
    article_title: str
    editor_id: int
    layout_user_id: Optional[int] = None
    source_file_id: Optional[str] = None
    source_file_url: Optional[str] = None
    instructions: Optional[str] = None
    status: str
    result_record_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        orm_mode = True
