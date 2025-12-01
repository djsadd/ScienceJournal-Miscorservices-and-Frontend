from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.services.notification_service import notify_author_article_status

router = APIRouter(prefix="/notifications/author", tags=["notifications:author"])


@router.post("/article-status")
def author_article_status(
    author_id: int,
    article_id: int,
    title: str,
    message: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # In future: enforce that caller has editor role
    n = notify_author_article_status(db, author_id=author_id, article_id=article_id, title=title, message=message)
    return n
