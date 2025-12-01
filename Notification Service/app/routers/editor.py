from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.services.notification_service import notify_editor_task
from app import config
import httpx
from pydantic import BaseModel

router = APIRouter(prefix="/notifications/editor", tags=["notifications:editor"])


@router.post("/task")
def editor_task(
    editor_id: int,
    task_key: str,
    title: str,
    message: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # In future: enforce that caller has admin/system role
    n = notify_editor_task(
        db,
        editor_id=editor_id,
        task_key=task_key,
        title=title,
        message=message,
    )
    return n


class BroadcastNewArticleRequest(BaseModel):
    article_id: int
    title: str
    message: str | None = None


@router.post("/broadcast-new-article")
def broadcast_new_article(
    payload: BroadcastNewArticleRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Notify all editors about a newly submitted article.

    Fetches editor user IDs from User Profile Service via internal endpoint
    protected by `X-Service-Secret` and creates one notification per editor.
    """
    users_url = getattr(config, "USERS_SERVICE_URL", "http://users:8000")
    secret = getattr(config, "SHARED_SERVICE_SECRET", "service-shared-secret")

    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(
                f"{users_url}/users/internal/editors/ids",
                headers={"X-Service-Secret": secret},
            )
            resp.raise_for_status()
            editor_ids: list[int] = resp.json() or []
    except Exception as e:
        # Fail fast: cannot resolve recipients
        raise RuntimeError(f"Failed to fetch editor ids: {e}")

    created = 0
    body = payload.message or f"New article submitted: {payload.title}"
    for editor_id in editor_ids:
        n = notify_editor_task(
            db,
            editor_id=editor_id,
            task_key=f"new_article:{payload.article_id}",
            title=payload.title,
            message=body,
        )
        if n and n.id:
            created += 1

    return {"notified": created, "editor_ids": editor_ids, "article_id": payload.article_id}
