from datetime import date, datetime, time, timedelta, timezone
from hashlib import sha256
import os
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from sqlalchemy import Date, cast, func
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import AnalyticsEvent

app = FastAPI(title="Analytics Service")

Base.metadata.create_all(bind=engine)

EventType = Literal["page_view", "article_view", "read_complete", "download"]


class EventIn(BaseModel):
    event_type: EventType
    article_id: int | None = None
    volume_id: int | None = None
    article_title: str | None = Field(default=None, max_length=500)
    path: str = Field(min_length=1, max_length=1000)
    visitor_id: str = Field(min_length=8, max_length=100)
    language: str | None = Field(default=None, max_length=10)
    referrer: str | None = Field(default=None, max_length=1000)
    seconds_on_page: int | None = Field(default=None, ge=0, le=86400)


def require_admin(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        payload = jwt.decode(
            authorization.split(" ", 1)[1],
            os.getenv("SECRET_KEY", "supersecretkey"),
            algorithms=["HS256"],
        )
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    roles = payload.get("roles") or []
    if isinstance(roles, str):
        roles = [roles]
    if "admin" not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator role required")
    return payload


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


@app.post("/analytics/events", status_code=status.HTTP_202_ACCEPTED)
def collect_event(payload: EventIn, request: Request, db: Session = Depends(get_db)):
    if payload.event_type != "page_view" and payload.article_id is None:
        raise HTTPException(status_code=422, detail="article_id is required for article events")

    # Store only a one-way pseudonymous key; raw IP addresses are never persisted.
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    fingerprint = "|".join((payload.visitor_id, forwarded, request.headers.get("user-agent", "")))
    visitor_hash = sha256((os.getenv("ANALYTICS_SALT", "science-journal") + fingerprint).encode()).hexdigest()

    # A reload should not inflate views. Actions remain countable after 30 minutes.
    if payload.event_type in {"page_view", "article_view"}:
        cutoff = utcnow() - timedelta(minutes=30)
        duplicate = db.query(AnalyticsEvent.id).filter(
            AnalyticsEvent.event_type == payload.event_type,
            AnalyticsEvent.article_id == payload.article_id,
            AnalyticsEvent.visitor_hash == visitor_hash,
            AnalyticsEvent.created_at >= cutoff,
        ).first()
        if duplicate:
            return {"accepted": True, "deduplicated": True}

    event = AnalyticsEvent(**payload.model_dump(exclude={"visitor_id"}), visitor_hash=visitor_hash)
    db.add(event)
    db.commit()
    return {"accepted": True, "deduplicated": False}


@app.get("/analytics/admin/dashboard")
def dashboard(
    days: int = 30,
    limit: int = 10,
    date_from: date | None = None,
    date_to: date | None = None,
    _: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    days = min(max(days, 1), 365)
    limit = min(max(limit, 1), 100)
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="date_from must not be later than date_to")
    since = datetime.combine(date_from, time.min, tzinfo=timezone.utc) if date_from else utcnow() - timedelta(days=days)
    until = datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=timezone.utc) if date_to else utcnow()
    report_end = date_to or utcnow().date()
    actual_days = max(1, min(365, (report_end - since.date()).days + 1))
    base = db.query(AnalyticsEvent).filter(AnalyticsEvent.created_at >= since, AnalyticsEvent.created_at < until)

    def event_count(kind: str) -> int:
        return base.filter(AnalyticsEvent.event_type == kind).count()

    views = event_count("article_view")
    reads = event_count("read_complete")
    downloads = event_count("download")
    visitors = base.with_entities(func.count(func.distinct(AnalyticsEvent.visitor_hash))).scalar() or 0
    page_views = event_count("page_view")

    grouped = (
        db.query(
            AnalyticsEvent.article_id,
            func.max(AnalyticsEvent.article_title).label("title"),
            func.count(AnalyticsEvent.id).filter(AnalyticsEvent.event_type == "article_view").label("views"),
            func.count(AnalyticsEvent.id).filter(AnalyticsEvent.event_type == "read_complete").label("reads"),
            func.count(AnalyticsEvent.id).filter(AnalyticsEvent.event_type == "download").label("downloads"),
            func.count(func.distinct(AnalyticsEvent.visitor_hash)).label("unique_visitors"),
        )
        .filter(AnalyticsEvent.created_at >= since, AnalyticsEvent.created_at < until, AnalyticsEvent.article_id.isnot(None))
        .group_by(AnalyticsEvent.article_id)
        .order_by(func.count(AnalyticsEvent.id).filter(AnalyticsEvent.event_type == "article_view").desc())
        .limit(limit)
        .all()
    )
    top_articles = [
        {
            "article_id": row.article_id,
            "title": row.title or f"Article #{row.article_id}",
            "views": row.views,
            "reads": row.reads,
            "downloads": row.downloads,
            "unique_visitors": row.unique_visitors,
            "read_rate": round(row.reads * 100 / row.views, 1) if row.views else 0,
        }
        for row in grouped
    ]

    volume_rows = (
        db.query(
            AnalyticsEvent.volume_id,
            func.count(AnalyticsEvent.id).filter(AnalyticsEvent.event_type == "article_view").label("views"),
            func.count(AnalyticsEvent.id).filter(AnalyticsEvent.event_type == "read_complete").label("reads"),
            func.count(AnalyticsEvent.id).filter(AnalyticsEvent.event_type == "download").label("downloads"),
            func.count(func.distinct(AnalyticsEvent.visitor_hash)).label("unique_visitors"),
        )
        .filter(AnalyticsEvent.created_at >= since, AnalyticsEvent.created_at < until, AnalyticsEvent.volume_id.isnot(None))
        .group_by(AnalyticsEvent.volume_id)
        .order_by(func.count(AnalyticsEvent.id).filter(AnalyticsEvent.event_type == "article_view").desc())
        .limit(limit).all()
    )
    top_volumes = [{"volume_id": row.volume_id, "views": row.views, "reads": row.reads, "downloads": row.downloads, "unique_visitors": row.unique_visitors} for row in volume_rows]

    page_rows = (
        db.query(AnalyticsEvent.path, func.count(AnalyticsEvent.id).label("views"), func.count(func.distinct(AnalyticsEvent.visitor_hash)).label("unique_visitors"))
        .filter(AnalyticsEvent.created_at >= since, AnalyticsEvent.created_at < until, AnalyticsEvent.event_type == "page_view")
        .group_by(AnalyticsEvent.path).order_by(func.count(AnalyticsEvent.id).desc()).limit(limit).all()
    )
    top_pages = [{"path": row.path, "views": row.views, "unique_visitors": row.unique_visitors} for row in page_rows]

    daily_rows = (
        db.query(
            cast(AnalyticsEvent.created_at, Date).label("date"),
            func.count(AnalyticsEvent.id).filter(AnalyticsEvent.event_type == "article_view").label("views"),
            func.count(AnalyticsEvent.id).filter(AnalyticsEvent.event_type == "page_view").label("page_views"),
            func.count(AnalyticsEvent.id).filter(AnalyticsEvent.event_type == "read_complete").label("reads"),
            func.count(AnalyticsEvent.id).filter(AnalyticsEvent.event_type == "download").label("downloads"),
        )
        .filter(AnalyticsEvent.created_at >= since, AnalyticsEvent.created_at < until)
        .group_by(cast(AnalyticsEvent.created_at, Date))
        .order_by(cast(AnalyticsEvent.created_at, Date))
        .all()
    )
    by_date = {str(row.date): row for row in daily_rows}
    trend = []
    for offset in range(actual_days):
        key = str(since.date() + timedelta(days=offset))
        row = by_date.get(key)
        trend.append({"date": key, "views": row.views if row else 0, "page_views": row.page_views if row else 0, "reads": row.reads if row else 0, "downloads": row.downloads if row else 0})

    return {
        "period_days": actual_days,
        "date_from": str(since.date()),
        "date_to": str(report_end),
        "summary": {
            "views": views,
            "unique_visitors": visitors,
            "reads": reads,
            "downloads": downloads,
            "page_views": page_views,
            "read_rate": round(reads * 100 / views, 1) if views else 0,
        },
        "trend": trend,
        "top_articles": top_articles,
        "top_volumes": top_volumes,
        "top_pages": top_pages,
    }


@app.get("/health")
@app.get("/analytics/health")
async def health():
    return {"status": "ok"}
