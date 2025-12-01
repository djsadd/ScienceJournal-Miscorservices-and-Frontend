import uuid
from sqlalchemy import Column, String, Integer, DateTime
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
