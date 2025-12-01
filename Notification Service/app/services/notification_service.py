from sqlalchemy.orm import Session
from typing import Optional

from app import models, schemas


def create_notification(
    db: Session,
    *,
    user_id: int,
    type: schemas.NotificationType,
    title: str,
    message: str,
    related_entity: Optional[str] = None,
) -> models.Notification:
    n = models.Notification(
        user_id=user_id,
        type=models.NotificationType(type),
        title=title,
        message=message,
        related_entity=related_entity,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


def notify_author_article_status(
    db: Session,
    *,
    author_id: int,
    article_id: int,
    title: str,
    message: str,
) -> models.Notification:
    return create_notification(
        db,
        user_id=author_id,
        type=schemas.NotificationType.article_status,
        title=title,
        message=message,
        related_entity=f"article:{article_id}",
    )


def notify_reviewer_assignment(
    db: Session,
    *,
    reviewer_id: int,
    assignment_id: int,
    title: str,
    message: str,
) -> models.Notification:
    return create_notification(
        db,
        user_id=reviewer_id,
        type=schemas.NotificationType.review_assignment,
        title=title,
        message=message,
        related_entity=f"review:{assignment_id}",
    )


def notify_editor_task(
    db: Session,
    *,
    editor_id: int,
    task_key: str,
    title: str,
    message: str,
) -> models.Notification:
    return create_notification(
        db,
        user_id=editor_id,
        type=schemas.NotificationType.editorial,
        title=title,
        message=message,
        related_entity=f"editorial:{task_key}",
    )
