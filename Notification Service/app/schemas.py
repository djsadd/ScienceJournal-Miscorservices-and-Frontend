from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class NotificationStatus(str, Enum):
    unread = "unread"
    read = "read"


class NotificationType(str, Enum):
    system = "system"
    article_status = "article_status"
    review_assignment = "review_assignment"
    editorial = "editorial"
    custom = "custom"


class NotificationBase(BaseModel):
    user_id: int
    type: NotificationType = NotificationType.system
    title: str
    message: str
    related_entity: Optional[str] = None
    # Optional links to a specific manuscript (article) or version
    article_id: Optional[int] = None
    article_version_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationArticleCreate(BaseModel):
    # Target user who will receive the notification
    user_id: int
    # The manuscript this notification relates to
    article_id: int
    # Optional specific version of the manuscript
    article_version_id: Optional[int] = None
    # Comments for the author (stored as message)
    comments: str
    # Optional title; if not provided, a sensible default is used
    title: Optional[str] = None
    # Optional type; defaults to editorial
    type: Optional[NotificationType] = NotificationType.article_status


class NotificationUpdateStatus(BaseModel):
    status: NotificationStatus


class NotificationOut(NotificationBase):
    id: int
    status: NotificationStatus
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        orm_mode = True

