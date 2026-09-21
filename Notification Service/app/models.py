from sqlalchemy import Boolean, Column, Integer, String, DateTime, Enum, Text, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base
import enum


class NotificationStatus(str, enum.Enum):
    unread = "unread"
    read = "read"


class NotificationType(str, enum.Enum):
    system = "system"
    article_status = "article_status"
    review_assignment = "review_assignment"
    editorial = "editorial"
    custom = "custom"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    type = Column(Enum(NotificationType), default=NotificationType.system, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    related_entity = Column(String, nullable=True)  # e.g. "article:123" (legacy/general reference)
    # Optional attachment to a specific manuscript (article) or its version
    # Avoid hard FK constraints across services; store as plain integers
    article_id = Column(Integer, nullable=True)
    article_version_id = Column(Integer, nullable=True)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.unread, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"
    __table_args__ = (UniqueConstraint("user_id", "type", name="uq_notification_preference_user_type"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)
    type = Column(Enum(NotificationType), nullable=False)
    in_app_enabled = Column(Boolean, nullable=False, default=True)
    email_enabled = Column(Boolean, nullable=False, default=True)


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True)
    key = Column(String, nullable=True, unique=True, index=True)
    type = Column(Enum(NotificationType), nullable=True, unique=True, index=True)
    name = Column(String, nullable=False)
    subject_template = Column(String, nullable=False)
    text_template = Column(Text, nullable=False)
    html_template = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

