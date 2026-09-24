import enum
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ReviewStatus(str, enum.Enum):
    processing = "processing"
    completed = "completed"
    failed = "failed"


class AIReview(Base):
    __tablename__ = "ai_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    article_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    requested_by: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    # Keep this as VARCHAR: the shared reviews database already has a PostgreSQL
    # enum named reviewstatus for human reviews, with a different value set.
    status: Mapped[str] = mapped_column(String(32), default=ReviewStatus.processing.value)
    language: Mapped[str] = mapped_column(String(8), default="ru")
    title: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    review_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommendation: Mapped[str | None] = mapped_column(String(32), nullable=True)
    strengths: Mapped[list | None] = mapped_column(JSON, nullable=True)
    weaknesses: Mapped[list | None] = mapped_column(JSON, nullable=True)
    publication_recommendations: Mapped[list | None] = mapped_column(JSON, nullable=True)
    scores: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    model: Mapped[str | None] = mapped_column(String(255), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
