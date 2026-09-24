from datetime import datetime, timezone

import httpx
import json
import re
from io import BytesIO
from urllib.parse import urlparse

from docx import Document
from pypdf import PdfReader

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app import config, models, schemas
from app.ai_client import AIProviderError, generate_review, stream_review
from app.database import SessionLocal, get_db
from app.security import get_current_editor

router = APIRouter(prefix="/ai-reviews", tags=["AI reviews"])


def _recommendation_from_text(text: str) -> str:
    match = re.search(r"ИТОГОВЫЙ_СТАТУС:\s*(РЕКОМЕНДОВАТЬ_ПОСЛЕ_ДОРАБОТКИ|НЕ_РЕКОМЕНДОВАТЬ|РЕКОМЕНДОВАТЬ)", text)
    return {
        "РЕКОМЕНДОВАТЬ": "accept",
        "РЕКОМЕНДОВАТЬ_ПОСЛЕ_ДОРАБОТКИ": "major_revision",
        "НЕ_РЕКОМЕНДОВАТЬ": "reject",
    }.get(match.group(1) if match else "", "major_revision")


async def _article_data(article_id: int) -> dict:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{config.ARTICLE_SERVICE_URL}/articles/internal/{article_id}/reviewer-detail",
                headers={"X-Service-Secret": config.SHARED_SERVICE_SECRET},
            )
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="Article not found")
        response.raise_for_status()
        return response.json()
    except HTTPException:
        raise
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Article service is unavailable") from exc


async def _manuscript_text(article: dict) -> str:
    raw_url = article.get("manuscript_file_url")
    if not raw_url:
        return ""
    path = urlparse(raw_url).path
    match = re.search(r"/files/([^/]+)", path)
    if not match:
        return ""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(f"{config.FILE_SERVICE_URL}/files/{match.group(1)}/download")
            response.raise_for_status()
        content_type = response.headers.get("content-type", "").lower()
        disposition = response.headers.get("content-disposition", "").lower()
        if "pdf" in content_type or ".pdf" in disposition:
            text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(response.content)).pages)
        elif "wordprocessingml" in content_type or ".docx" in disposition:
            text = "\n".join(paragraph.text for paragraph in Document(BytesIO(response.content)).paragraphs)
        elif content_type.startswith("text/") or ".txt" in disposition:
            text = response.text
        else:
            return ""
        return text[: config.AI_MAX_INPUT_CHARS]
    except Exception:
        return ""


async def _process(review_id: int, source: dict, language: str, instructions: str) -> None:
    db = SessionLocal()
    try:
        review = db.get(models.AIReview, review_id)
        if review is None:
            return
        try:
            result = await generate_review(
                title=source.get("title", ""), abstract=source.get("abstract", ""),
                manuscript_text=source.get("manuscript_text", ""), language=language,
                instructions=instructions,
            )
            for field in ("review_text", "recommendation", "strengths", "weaknesses", "publication_recommendations", "scores"):
                setattr(review, field, result[field])
            review.status = models.ReviewStatus.completed.value
            review.model = config.AI_MODEL
        except AIProviderError as exc:
            review.status = models.ReviewStatus.failed.value
            review.error_message = str(exc)[:2000]
        review.completed_at = datetime.now(timezone.utc)
        db.commit()
    finally:
        db.close()


@router.post("", response_model=schemas.AIReviewOut, status_code=202)
async def create_ai_review(
    payload: schemas.AIReviewCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_editor),
):
    article = await _article_data(payload.article_id) if payload.article_id else {}
    title = payload.title or article.get("title_ru") or article.get("title_kz") or article.get("title_en") or ""
    abstract = payload.abstract or article.get("abstract_ru") or article.get("abstract_kz") or article.get("abstract_en") or ""
    manuscript = payload.manuscript_text or (await _manuscript_text(article) if article else "")
    source = {"title": title, "abstract": abstract, "manuscript_text": manuscript}
    if not any(value.strip() for value in source.values()):
        raise HTTPException(status_code=422, detail="Article contains no text to review")

    review = models.AIReview(
        article_id=payload.article_id, requested_by=user["user_id"], language=payload.language,
        title=title, status=models.ReviewStatus.processing.value,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    background_tasks.add_task(_process, review.id, source, payload.language, payload.additional_instructions or "")
    return review


@router.post("/stream")
async def create_streaming_ai_review(
    payload: schemas.AIReviewCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_editor),
):
    article = await _article_data(payload.article_id) if payload.article_id else {}
    title = payload.title or article.get("title_ru") or article.get("title_kz") or article.get("title_en") or ""
    abstract = payload.abstract or article.get("abstract_ru") or article.get("abstract_kz") or article.get("abstract_en") or ""
    manuscript = payload.manuscript_text or (await _manuscript_text(article) if article else "")
    if not any(value.strip() for value in (title, abstract, manuscript)):
        raise HTTPException(status_code=422, detail="Article contains no text to review")
    review = models.AIReview(article_id=payload.article_id, requested_by=user["user_id"], language=payload.language,
                             title=title, status=models.ReviewStatus.processing.value, model=config.AI_MODEL)
    db.add(review)
    db.commit()
    review_id = review.id

    async def events():
        chunks: list[str] = []
        yield json.dumps({"type": "started", "review_id": review_id, "model": config.AI_MODEL}, ensure_ascii=False) + "\n"
        try:
            async for delta in stream_review(title=title, abstract=abstract, manuscript_text=manuscript, language=payload.language):
                chunks.append(delta)
                yield json.dumps({"type": "delta", "text": delta}, ensure_ascii=False) + "\n"
            full_text = "".join(chunks)
            recommendation = _recommendation_from_text(full_text)
            session = SessionLocal()
            try:
                saved = session.get(models.AIReview, review_id)
                saved.review_text = full_text
                saved.recommendation = recommendation
                saved.status = models.ReviewStatus.completed.value
                saved.completed_at = datetime.now(timezone.utc)
                session.commit()
            finally:
                session.close()
            yield json.dumps({"type": "completed", "review_id": review_id, "recommendation": recommendation}, ensure_ascii=False) + "\n"
        except Exception as exc:
            session = SessionLocal()
            try:
                saved = session.get(models.AIReview, review_id)
                saved.status = models.ReviewStatus.failed.value
                saved.error_message = str(exc)[:2000]
                saved.completed_at = datetime.now(timezone.utc)
                session.commit()
            finally:
                session.close()
            yield json.dumps({"type": "error", "message": str(exc)}, ensure_ascii=False) + "\n"

    return StreamingResponse(events(), media_type="application/x-ndjson", headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"})


@router.get("", response_model=list[schemas.AIReviewOut])
def list_ai_reviews(
    limit: int = Query(default=20, ge=1, le=100),
    article_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_editor),
):
    query = db.query(models.AIReview)
    if article_id is not None:
        query = query.filter(models.AIReview.article_id == article_id)
    if "admin" not in user["roles"]:
        query = query.filter(models.AIReview.requested_by == user["user_id"])
    return query.order_by(models.AIReview.created_at.desc()).limit(limit).all()


@router.get("/{review_id}", response_model=schemas.AIReviewOut)
def get_ai_review(
    review_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_editor),
):
    review = db.get(models.AIReview, review_id)
    if review is None:
        raise HTTPException(status_code=404, detail="AI review not found")
    if review.requested_by != user["user_id"] and "admin" not in user["roles"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return review
