from typing import List

import httpx
from fastapi import APIRouter, Depends, HTTPException, Header
from jose import JWTError, jwt
from sqlalchemy import and_, select
from sqlalchemy.orm import Session, joinedload

from app import config, database, models, schemas

router = APIRouter(prefix="/volumes", tags=["volumes"])


def _file_id_to_url(file_id: str | None):
    if not file_id:
        return None
    return f"/files/{file_id}/download"


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        user_id = payload.get("sub")
        roles = payload.get("roles", ["author"])
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": int(user_id), "roles": roles}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def ensure_editor(user):
    roles = user.get("roles", [])
    if "editor" not in roles and "admin" not in roles:
        raise HTTPException(status_code=403, detail="Editor role required")


def _load_volume_article_orders(db: Session, volume_ids: list[int]) -> dict[int, list[tuple[int, int]]]:
    if not volume_ids:
        return {}
    rows = db.execute(
        select(
            models.volume_articles.c.volume_id,
            models.volume_articles.c.article_id,
            models.volume_articles.c.sort_order,
        )
        .where(models.volume_articles.c.volume_id.in_(volume_ids))
        .order_by(
            models.volume_articles.c.volume_id.asc(),
            models.volume_articles.c.sort_order.asc(),
            models.volume_articles.c.article_id.asc(),
        )
    ).all()
    result: dict[int, list[tuple[int, int]]] = {}
    for volume_id, article_id, sort_order in rows:
        result.setdefault(volume_id, []).append((article_id, sort_order))
    return result


def _apply_article_order(db: Session, volumes: list[models.Volume]):
    order_map = _load_volume_article_orders(db, [v.id for v in volumes if v.id is not None])
    for volume in volumes:
        ordered = order_map.get(volume.id, [])
        if not ordered or not getattr(volume, "articles", None):
            continue
        article_by_id = {article.id: article for article in volume.articles}
        seen_article_ids = set()
        reordered_articles = []
        for article_id, sort_order in ordered:
            article = article_by_id.get(article_id)
            if article is None:
                continue
            setattr(article, "sort_order", sort_order)
            reordered_articles.append(article)
            seen_article_ids.add(article_id)
        for article in volume.articles:
            if article.id in seen_article_ids:
                continue
            setattr(article, "sort_order", None)
            reordered_articles.append(article)
        volume.articles = reordered_articles


def _attach_articles_to_volume(db: Session, volume_id: int, article_ids: list[int]):
    if not article_ids:
        return
    articles = db.query(models.Article).filter(models.Article.id.in_(article_ids)).all()
    found_ids = {a.id for a in articles}
    missing = [aid for aid in article_ids if aid not in found_ids]
    if missing:
        raise HTTPException(status_code=400, detail=f"Articles not found: {missing}")
    not_published = [a.id for a in articles if a.status != models.ArticleStatus.published]
    if not_published:
        raise HTTPException(status_code=400, detail=f"Articles not published: {not_published}")
    for sort_order, article_id in enumerate(article_ids, start=1):
        db.execute(
            models.volume_articles.insert().values(
                volume_id=volume_id,
                article_id=article_id,
                sort_order=sort_order,
            )
        )


def _get_volume_with_articles(db: Session, volume_id: int, active_only: bool = False):
    query = (
        db.query(models.Volume)
        .options(
            joinedload(models.Volume.articles).joinedload(models.Article.authors),
            joinedload(models.Volume.articles).joinedload(models.Article.keywords),
        )
        .filter(models.Volume.id == volume_id)
    )
    if active_only:
        query = query.filter(models.Volume.is_active.is_(True))
    volume = query.first()
    if volume:
        _apply_article_order(db, [volume])
    return volume


@router.get("/", response_model=List[schemas.VolumeOut])
def list_volumes(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    year: int | None = None,
    number: int | None = None,
    month: int | None = None,
    active_only: bool | None = None,
):
    query = db.query(models.Volume).options(
        joinedload(models.Volume.articles).joinedload(models.Article.authors),
        joinedload(models.Volume.articles).joinedload(models.Article.keywords),
    )
    if year is not None:
        query = query.filter(models.Volume.year == year)
    if number is not None:
        query = query.filter(models.Volume.number == number)
    if month is not None:
        query = query.filter(models.Volume.month == month)
    roles = current_user.get("roles", [])
    is_editor = "editor" in roles or "admin" in roles
    effective_active_only = (not is_editor) if active_only is None else bool(active_only)
    if effective_active_only:
        query = query.filter(models.Volume.is_active.is_(True))
    volumes = query.order_by(models.Volume.year.desc(), models.Volume.number.desc()).all()
    _apply_article_order(db, volumes)
    _enrich_articles_with_layout(volumes)
    return volumes


@router.get("/public", response_model=List[schemas.VolumeOut])
def list_active_volumes_public(
    db: Session = Depends(get_db),
    year: int | None = None,
    number: int | None = None,
    month: int | None = None,
):
    query = db.query(models.Volume).options(
        joinedload(models.Volume.articles).joinedload(models.Article.authors),
        joinedload(models.Volume.articles).joinedload(models.Article.keywords),
    ).filter(models.Volume.is_active.is_(True))

    if year is not None:
        query = query.filter(models.Volume.year == year)
    if number is not None:
        query = query.filter(models.Volume.number == number)
    if month is not None:
        query = query.filter(models.Volume.month == month)

    volumes = query.order_by(models.Volume.year.desc(), models.Volume.number.desc()).all()
    _apply_article_order(db, volumes)
    _enrich_articles_with_layout(volumes)
    return volumes


@router.get("/public/{volume_id}", response_model=schemas.VolumeOut)
def get_active_volume_public(
    volume_id: int,
    db: Session = Depends(get_db),
):
    volume = _get_volume_with_articles(db, volume_id, active_only=True)
    if not volume:
        raise HTTPException(status_code=404, detail="Active volume not found")
    _enrich_articles_with_layout([volume])
    return volume


@router.get("/{volume_id}", response_model=schemas.VolumeOut)
def get_volume(
    volume_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    volume = _get_volume_with_articles(db, volume_id)
    if not volume:
        raise HTTPException(status_code=404, detail="Volume not found")
    _enrich_articles_with_layout([volume])
    return volume


@router.post("/", response_model=schemas.VolumeOut, status_code=201)
def create_volume(
    payload: schemas.VolumeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    ensure_editor(current_user)

    volume = models.Volume(
        year=payload.year,
        number=payload.number,
        month=payload.month,
        title_kz=payload.title_kz,
        title_en=payload.title_en,
        title_ru=payload.title_ru,
        description=payload.description,
        complete_issue_file_url=_file_id_to_url(payload.complete_issue_file_id) or payload.complete_issue_file_url,
        cover_file_url=_file_id_to_url(payload.cover_file_id) or payload.cover_file_url,
        contents_file_url=_file_id_to_url(payload.contents_file_id) or payload.contents_file_url,
        is_active=payload.is_active,
    )
    db.add(volume)
    db.flush()

    if payload.article_ids:
        _attach_articles_to_volume(db, volume.id, payload.article_ids)

    db.commit()
    volume = _get_volume_with_articles(db, volume.id)
    return volume


@router.put("/{volume_id}", response_model=schemas.VolumeOut)
@router.patch("/{volume_id}", response_model=schemas.VolumeOut)
def update_volume(
    volume_id: int,
    payload: schemas.VolumeUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    ensure_editor(current_user)
    volume = db.query(models.Volume).filter(models.Volume.id == volume_id).first()
    if not volume:
        raise HTTPException(status_code=404, detail="Volume not found")

    update_data = payload.dict(exclude_unset=True)

    for field in [
        "year",
        "number",
        "month",
        "title_kz",
        "title_en",
        "title_ru",
        "description",
        "is_active",
        "complete_issue_file_url",
        "cover_file_url",
        "contents_file_url",
    ]:
        if field in update_data:
            setattr(volume, field, update_data[field])

    if "complete_issue_file_id" in update_data:
        volume.complete_issue_file_url = _file_id_to_url(update_data["complete_issue_file_id"])
    if "cover_file_id" in update_data:
        volume.cover_file_url = _file_id_to_url(update_data["cover_file_id"])
    if "contents_file_id" in update_data:
        volume.contents_file_url = _file_id_to_url(update_data["contents_file_id"])

    if "article_ids" in update_data and update_data["article_ids"] is not None:
        article_ids = update_data["article_ids"]
        db.execute(models.volume_articles.delete().where(models.volume_articles.c.volume_id == volume_id))
        _attach_articles_to_volume(db, volume.id, article_ids)

    db.commit()
    volume = _get_volume_with_articles(db, volume_id)
    _enrich_articles_with_layout([volume])
    return volume


@router.patch("/{volume_id}/articles/{article_id}/order", response_model=schemas.VolumeOut)
def update_volume_article_order(
    volume_id: int,
    article_id: int,
    payload: schemas.VolumeArticleOrderUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    ensure_editor(current_user)
    volume = db.query(models.Volume).filter(models.Volume.id == volume_id).first()
    if not volume:
        raise HTTPException(status_code=404, detail="Volume not found")

    rows = db.execute(
        select(
            models.volume_articles.c.article_id,
            models.volume_articles.c.sort_order,
        )
        .where(models.volume_articles.c.volume_id == volume_id)
        .order_by(models.volume_articles.c.sort_order.asc(), models.volume_articles.c.article_id.asc())
    ).all()
    if not rows:
        raise HTTPException(status_code=404, detail="Volume has no articles")

    article_ids = [row.article_id for row in rows]
    if article_id not in article_ids:
        raise HTTPException(status_code=404, detail="Article not found in volume")

    current_index = article_ids.index(article_id)
    target_index = current_index - 1 if payload.direction == "up" else current_index + 1
    if target_index < 0 or target_index >= len(article_ids):
        raise HTTPException(status_code=400, detail="Article cannot be moved further")

    target_article_id = article_ids[target_index]
    current_sort_order = rows[current_index].sort_order
    target_sort_order = rows[target_index].sort_order

    db.execute(
        models.volume_articles.update()
        .where(
            and_(
                models.volume_articles.c.volume_id == volume_id,
                models.volume_articles.c.article_id == article_id,
            )
        )
        .values(sort_order=target_sort_order)
    )
    db.execute(
        models.volume_articles.update()
        .where(
            and_(
                models.volume_articles.c.volume_id == volume_id,
                models.volume_articles.c.article_id == target_article_id,
            )
        )
        .values(sort_order=current_sort_order)
    )

    db.commit()

    volume = _get_volume_with_articles(db, volume_id)
    _enrich_articles_with_layout([volume])
    return volume


@router.delete("/{volume_id}", status_code=204)
def delete_volume(
    volume_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    ensure_editor(current_user)
    volume = db.query(models.Volume).filter(models.Volume.id == volume_id).first()
    if not volume:
        raise HTTPException(status_code=404, detail="Volume not found")
    db.execute(models.volume_articles.delete().where(models.volume_articles.c.volume_id == volume_id))
    db.delete(volume)
    db.commit()
    return None


def _enrich_articles_with_layout(volumes: list[models.Volume]):
    layout_base = getattr(config, "LAYOUT_SERVICE_URL", "http://layout:8000")
    article_map = {}
    for volume in volumes:
        for article in getattr(volume, "articles", []) or []:
            if article.status == models.ArticleStatus.published:
                article_map[article.id] = article
    if not article_map:
        return
    for article_id, article in article_map.items():
        try:
            with httpx.Client(timeout=3.0) as client:
                resp = client.get(f"{layout_base}/layout/articles/{article_id}/records")
                if resp.status_code == 200:
                    data = resp.json() or []
                    if data:
                        layout_record = data[0]
                        file_url = layout_record.get("file_url")
                        if file_url:
                            setattr(article, "layout_file_url", file_url)
        except Exception:
            pass
