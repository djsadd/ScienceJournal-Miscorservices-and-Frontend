import uuid
from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class LayoutRecord(Base):
    __tablename__ = "layout_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    article_id = Column(Integer, nullable=True)
    volume_id = Column(Integer, nullable=True)

    file_id = Column(String, nullable=True)
    file_url = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class LayoutTask(Base):
    __tablename__ = "layout_tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    article_id = Column(Integer, nullable=False, index=True)
    article_title = Column(String, nullable=False)
    editor_id = Column(Integer, nullable=False, index=True)
    layout_user_id = Column(Integer, nullable=True, index=True)
    source_file_id = Column(String, nullable=True)
    source_file_url = Column(String, nullable=True)
    instructions = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="pending", index=True)
    result_record_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
