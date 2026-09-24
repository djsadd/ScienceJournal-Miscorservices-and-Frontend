from datetime import datetime
from typing import List, Optional
import logging
import re
import string

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app import models, schemas, config
from app.deps import get_db, get_current_user
from app.services.email_service import send_email
from app.email_templates import EMAIL_EVENTS, SAMPLE_VALUES

router = APIRouter(prefix="/notifications", tags=["notifications"])


logger = logging.getLogger(__name__)

NOTIFICATION_TYPES = list(models.NotificationType)
DEFAULT_TEMPLATES = {
    key: (
        event["name"],
        models.NotificationType(event["type"]) if event["type"] else None,
        event["subject"],
        event["text"],
    )
    for key, event in EMAIL_EVENTS.items()
}


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


def _send_notification_email(user_id: int, subject: str, message: str, html: str, notification_id: int) -> None:
    # Resolve recipient email via Auth service
    recipient = _get_user_email(user_id)
    if not recipient:
        logger.info("No email found for user_id=%s; skip email", user_id)
        return
    text = message
    try:
        send_email(recipient, subject, text, html)
        logger.info("Email sent to %s for notification %s", recipient, notification_id)
    except Exception as e:
        logger.warning("Email send failed for notification %s: %s", notification_id, e)


def _render_email_template(db: Session, key: str, values: dict, fallback: tuple[str, str, str]) -> Optional[tuple[str, str, str]]:
    template = db.query(models.EmailTemplate).filter(models.EmailTemplate.key == key).first()
    if not template and key in DEFAULT_TEMPLATES:
        name, notification_type, subject, text = DEFAULT_TEMPLATES[key]
        template = models.EmailTemplate(
            key=key,
            type=notification_type,
            name=name,
            subject_template=subject,
            text_template=text,
            html_template=EMAIL_EVENTS[key]["html"],
            is_active=True,
        )
        db.add(template)
        db.commit()
        db.refresh(template)
    if template and not template.is_active:
        return None
    if not template:
        return fallback
    try:
        return (
            template.subject_template.format_map(values),
            template.text_template.format_map(values),
            (template.html_template or "<p>{message}</p>").format_map(values),
        )
    except (KeyError, ValueError):
        logger.warning("Invalid email template %s; using event defaults", key)
        return fallback


def _queue_notification_email(
    background_tasks: BackgroundTasks,
    n: models.Notification,
    db: Session,
    template_key: Optional[str] = None,
    template_variables: Optional[dict] = None,
) -> None:
    preference = db.query(models.NotificationPreference).filter(
        models.NotificationPreference.user_id == n.user_id,
        models.NotificationPreference.type == n.type,
    ).first()
    if preference and not preference.email_enabled:
        return
    values = {
        "title": n.title,
        "message": n.message,
        "article_id": n.article_id or "",
        **(template_variables or {}),
    }
    key = template_key or f"notification_{n.type.value}"
    rendered = _render_email_template(
        db, key, values, (n.title, n.message, f"<p>{n.message}</p>")
    )
    if rendered is None:
        return
    subject, text, html = rendered
    # Copy values now; the request-scoped SQLAlchemy session may be closed later.
    background_tasks.add_task(
        _send_notification_email, n.user_id, subject, text, html, n.id
    )


def _in_app_enabled(db: Session, user_id: int, notification_type: models.NotificationType) -> bool:
    preference = db.query(models.NotificationPreference).filter(
        models.NotificationPreference.user_id == user_id,
        models.NotificationPreference.type == notification_type,
    ).first()
    return preference is None or preference.in_app_enabled


def _send_direct_email(user_id: int, subject: str, text: str, html: Optional[str]) -> None:
    recipient = _get_user_email(user_id)
    if not recipient:
        logger.warning("Recipient email not found for user_id=%s", user_id)
        return
    try:
        send_email(recipient, subject, text, html)
    except Exception as exc:
        logger.warning("Internal email send failed for user_id=%s: %s", user_id, exc)


def _send_email_to_address(recipient: str, subject: str, text: str, html: Optional[str]) -> None:
    try:
        send_email(recipient, subject, text, html)
        logger.info("Test template email sent to %s", recipient)
    except Exception as exc:
        logger.warning("Test template email failed for %s: %s", recipient, exc)


@router.post("/", response_model=schemas.NotificationOut)
def create_notification(
    payload: schemas.NotificationCreate,
    background_tasks: BackgroundTasks,
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
    _queue_notification_email(background_tasks, notification, db, payload.template_key, payload.template_variables)
    return notification


@router.post("/internal", response_model=schemas.NotificationOut)
def create_notification_internal(
    payload: schemas.NotificationCreate,
    request: Request,
    background_tasks: BackgroundTasks,
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
    _queue_notification_email(background_tasks, notification, db, payload.template_key, payload.template_variables)
    return notification


@router.post("/internal/email", response_model=schemas.MessageResponse)
def send_internal_email(
    payload: schemas.InternalEmailCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    secret = request.headers.get("X-Service-Secret")
    if not secret or secret != config.SHARED_SERVICE_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    values = {
        "title": payload.subject,
        "message": payload.text,
        **payload.template_variables,
    }
    rendered = _render_email_template(
        db,
        payload.template_key or "notification_system",
        values,
        (payload.subject, payload.text, payload.html or f"<p>{payload.text}</p>"),
    )
    if rendered is None:
        return {"message": "Email disabled for this event"}
    subject, text, html = rendered
    background_tasks.add_task(
        _send_direct_email,
        payload.user_id,
        subject,
        text,
        html,
    )
    return {"message": "Email queued"}


@router.post("/article", response_model=schemas.NotificationOut)
def create_article_notification(
    payload: schemas.NotificationArticleCreate,
    background_tasks: BackgroundTasks,
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
    _queue_notification_email(
        background_tasks,
        notification,
        db,
        "editor_comments",
        {"comments": payload.comments, "article_id": str(payload.article_id)},
    )
    return notification


@router.get("/preferences", response_model=List[schemas.NotificationPreferenceItem])
def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    saved = {
        item.type: item
        for item in db.query(models.NotificationPreference).filter(
            models.NotificationPreference.user_id == current_user["user_id"]
        ).all()
    }
    return [
        {
            "type": notification_type,
            "in_app_enabled": saved.get(notification_type).in_app_enabled if notification_type in saved else True,
            "email_enabled": saved.get(notification_type).email_enabled if notification_type in saved else True,
        }
        for notification_type in NOTIFICATION_TYPES
    ]


@router.put("/preferences", response_model=List[schemas.NotificationPreferenceItem])
def update_notification_preferences(
    payload: schemas.NotificationPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    for incoming in payload.items:
        preference = db.query(models.NotificationPreference).filter(
            models.NotificationPreference.user_id == current_user["user_id"],
            models.NotificationPreference.type == incoming.type,
        ).first()
        if not preference:
            preference = models.NotificationPreference(user_id=current_user["user_id"], type=incoming.type)
            db.add(preference)
        preference.in_app_enabled = incoming.in_app_enabled
        preference.email_enabled = incoming.email_enabled
    db.commit()
    return get_notification_preferences(db, current_user)


def _ensure_admin(current_user: dict) -> None:
    roles = current_user.get("roles") or []
    if isinstance(roles, str):
        roles = [roles]
    if "admin" not in roles:
        raise HTTPException(status_code=403, detail="Admin role required")


def _ensure_default_templates(db: Session) -> None:
    existing = {item.key for item in db.query(models.EmailTemplate).all() if item.key}
    for key, (name, notification_type, subject, text) in DEFAULT_TEMPLATES.items():
        if key not in existing:
            db.add(models.EmailTemplate(
                key=key,
                type=notification_type,
                name=name,
                subject_template=subject,
                text_template=text,
                html_template=EMAIL_EVENTS[key]["html"],
                is_active=True,
            ))
    db.commit()


@router.get("/admin/email-templates", response_model=List[schemas.EmailTemplateOut])
def list_email_templates(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _ensure_admin(current_user)
    _ensure_default_templates(db)
    templates = db.query(models.EmailTemplate).order_by(models.EmailTemplate.id).all()
    return [_template_out(item) for item in templates]


def _template_out(template: models.EmailTemplate) -> dict:
    event = EMAIL_EVENTS.get(template.key, {})
    return {
        "key": template.key,
        "type": template.type,
        "name": template.name,
        "subject_template": template.subject_template,
        "text_template": template.text_template,
        "html_template": template.html_template,
        "is_active": template.is_active,
        "updated_at": template.updated_at,
        "description": event.get("description", ""),
        "variables": [
            {"name": name, "description": description, "sample": str(SAMPLE_VALUES.get(name, ""))}
            for name, description in event.get("variables", {}).items()
        ],
    }


@router.put("/admin/email-templates/{template_key}", response_model=schemas.EmailTemplateOut)
def update_email_template(
    template_key: str,
    payload: schemas.EmailTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _ensure_admin(current_user)
    _ensure_default_templates(db)
    template = db.query(models.EmailTemplate).filter(models.EmailTemplate.key == template_key).first()
    if not template:
        raise HTTPException(status_code=404, detail="Email template not found")
    event = EMAIL_EVENTS.get(template_key, {})
    allowed_variables = set(event.get("variables", {}))
    formatter = string.Formatter()
    try:
        used_variables = {
            field_name.split(".", 1)[0].split("[", 1)[0]
            for value in (payload.subject_template, payload.text_template, payload.html_template or "")
            for _, field_name, _, _ in formatter.parse(value)
            if field_name
        }
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"Ошибка синтаксиса шаблона: {exc}") from exc
    unknown_variables = sorted(used_variables - allowed_variables)
    if unknown_variables:
        raise HTTPException(
            status_code=422,
            detail=f"Недоступные переменные для этого события: {', '.join(unknown_variables)}",
        )
    for field, value in payload.dict().items():
        setattr(template, field, value)
    db.commit()
    db.refresh(template)
    return _template_out(template)


@router.post("/admin/email-templates/{template_key}/test", response_model=schemas.MessageResponse)
def test_email_template(
    template_key: str,
    payload: schemas.EmailTemplateTestRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    _ensure_admin(current_user)
    recipient = payload.recipient_email.strip().lower()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", recipient):
        raise HTTPException(status_code=422, detail="Некорректный адрес электронной почты")

    event_content = {
        "notification_system": (
            "Уведомление редакционной системы",
            "В вашем личном кабинете появилось новое уведомление.",
        ),
        "notification_article_status": (
            "Статус рукописи изменён",
            "Статус рукописи «Искусственный интеллект в современной науке» был обновлён. Подробности доступны в личном кабинете.",
        ),
        "notification_review_assignment": (
            "Назначена новая рецензия",
            "Вам назначена рецензия рукописи «Искусственный интеллект в современной науке».",
        ),
        "notification_editorial": (
            "Сообщение от редакции",
            "Редакция оставила новое сообщение по вашей рукописи «Искусственный интеллект в современной науке».",
        ),
        "notification_custom": (
            "Новое уведомление",
            "В личном кабинете доступно новое сообщение редакции журнала.",
        ),
    }
    title, message = event_content.get(
        template_key,
        ("Уведомление научного журнала", "В личном кабинете доступна новая информация по вашей рукописи."),
    )
    sample_values = {**SAMPLE_VALUES, "title": title, "message": message}
    try:
        subject = payload.subject_template.format_map(sample_values)
        text = payload.text_template.format_map(sample_values)
        html = (payload.html_template or "<p>{message}</p>").format_map(sample_values)
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"Ошибка в переменных шаблона: {exc}") from exc

    background_tasks.add_task(_send_email_to_address, recipient, subject, text, html)
    return {"message": f"Письмо поставлено в очередь для {recipient}"}


@router.get("/", response_model=List[schemas.NotificationOut])
def list_notifications(
    status: Optional[schemas.NotificationStatus] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = db.query(models.Notification).filter(models.Notification.user_id == current_user["user_id"])
    disabled_types = [
        item.type
        for item in db.query(models.NotificationPreference).filter(
            models.NotificationPreference.user_id == current_user["user_id"],
            models.NotificationPreference.in_app_enabled.is_(False),
        ).all()
    ]
    if disabled_types:
        query = query.filter(~models.Notification.type.in_(disabled_types))
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
