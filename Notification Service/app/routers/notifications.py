from datetime import datetime
from typing import List, Optional
import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app import models, schemas, config
from app.deps import get_db, get_current_user
from app.services.email_service import send_email

router = APIRouter(prefix="/notifications", tags=["notifications"])


logger = logging.getLogger(__name__)


def _get_user_email(user_id: int) -> Optional[str]:
    try:
        with httpx.Client(timeout=5.0) as client:
            r = client.get(f"{config.AUTH_SERVICE_URL}/auth/users/{user_id}")
            if r.status_code == 200:
                data = r.json()
                email = data.get("email")
                if email and isinstance(email, str):
                    return email
    except Exception as e:
        logger.warning("Failed to resolve user email for %s: %s", user_id, e)
    return None


def _maybe_send_email_for_notification(n: models.Notification) -> None:
    # Resolve recipient email via Auth service
    recipient = _get_user_email(n.user_id)
    if not recipient:
        logger.info("No email found for user_id=%s; skip email", n.user_id)
        return
    subject = n.title
    text = n.message
    html = f"<p>{n.message}</p>"
    try:
        send_email(recipient, subject, text, html)
        logger.info("Email sent to %s for notification %s", recipient, n.id)
    except Exception as e:
        logger.warning("Email send failed for notification %s: %s", n.id, e)


@router.post("/", response_model=schemas.NotificationOut)
def create_notification(
    payload: schemas.NotificationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    notification = models.Notification(
        user_id=payload.user_id,
        type=payload.type,
        title=payload.title,
        message=payload.message,
        related_entity=payload.related_entity,
        article_id=payload.article_id,
        article_version_id=payload.article_version_id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    _maybe_send_email_for_notification(notification)
    return notification


@router.post("/internal", response_model=schemas.NotificationOut)
def create_notification_internal(
    payload: schemas.NotificationCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Service-to-service notification creation protected by shared secret.
    Accepts the same payload as public create endpoint but validates
    header `X-Service-Secret` equals `config.SHARED_SERVICE_SECRET`.
    """
    secret = request.headers.get("X-Service-Secret")
    if not secret or secret != config.SHARED_SERVICE_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    notification = models.Notification(
        user_id=payload.user_id,
        type=payload.type,
        title=payload.title,
        message=payload.message,
        related_entity=payload.related_entity,
        article_id=payload.article_id,
        article_version_id=payload.article_version_id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    _maybe_send_email_for_notification(notification)
    return notification


@router.post("/article", response_model=schemas.NotificationOut)
def create_article_notification(
    payload: schemas.NotificationArticleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Create a notification tied to a specific manuscript (article), including editor comments.

    Request body:
    - user_id: recipient user id
    - article_id: manuscript id
    - article_version_id: optional version id
    - comments: free text to send to the recipient (stored as message)
    - title: optional notification title (default provided if omitted)
    - type: optional NotificationType (defaults to 'editorial')
    """
    title = payload.title or "Комментарии по рукописи"
    notification = models.Notification(
        user_id=payload.user_id,
        type=payload.type or models.NotificationType.editorial,
        title=title,
        message=payload.comments,
        related_entity=f"article:{payload.article_id}",
        article_id=payload.article_id,
        article_version_id=payload.article_version_id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    _maybe_send_email_for_notification(notification)
    return notification


@router.get("/", response_model=List[schemas.NotificationOut])
def list_notifications(
    status: Optional[schemas.NotificationStatus] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = db.query(models.Notification).filter(models.Notification.user_id == current_user["user_id"])
    if status:
        query = query.filter(models.Notification.status == status)
    notifications = (
        query.order_by(models.Notification.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return notifications


@router.get("/{notification_id}", response_model=schemas.NotificationOut)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    notification = (
        db.query(models.Notification)
        .filter(
            models.Notification.id == notification_id,
            models.Notification.user_id == current_user["user_id"],
        )
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.post("/{notification_id}/read", response_model=schemas.NotificationOut)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    notification = (
        db.query(models.Notification)
        .filter(
            models.Notification.id == notification_id,
            models.Notification.user_id == current_user["user_id"],
        )
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.status = models.NotificationStatus.read
    notification.read_at = datetime.utcnow()
    db.commit()
    db.refresh(notification)
    return notification


@router.delete("/{notification_id}", status_code=204)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    notification = (
        db.query(models.Notification)
        .filter(
            models.Notification.id == notification_id,
            models.Notification.user_id == current_user["user_id"],
        )
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notification)
    db.commit()
    return None
