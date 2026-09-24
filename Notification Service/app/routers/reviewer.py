from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.services.notification_service import notify_reviewer_assignment
from app.routers.notifications import _queue_notification_email

router = APIRouter(prefix="/notifications/reviewer", tags=["notifications:reviewer"])


@router.post("/assignment")
def reviewer_assignment(
    reviewer_id: int,
    assignment_id: int,
    title: str,
    message: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # In future: enforce that caller has editor role
    n = notify_reviewer_assignment(
        db,
        reviewer_id=reviewer_id,
        assignment_id=assignment_id,
        title=title,
        message=message,
    )
    _queue_notification_email(background_tasks, n, db)
    return n
