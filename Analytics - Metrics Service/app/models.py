from sqlalchemy import BigInteger, Column, DateTime, Index, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    event_type = Column(String(32), nullable=False, index=True)
    article_id = Column(Integer, nullable=True, index=True)
    volume_id = Column(Integer, nullable=True, index=True)
    article_title = Column(String(500), nullable=True)
    path = Column(String(1000), nullable=False)
    visitor_hash = Column(String(64), nullable=False, index=True)
    language = Column(String(10), nullable=True)
    referrer = Column(String(1000), nullable=True)
    seconds_on_page = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    __table_args__ = (
        Index("ix_analytics_article_type_created", "article_id", "event_type", "created_at"),
    )
