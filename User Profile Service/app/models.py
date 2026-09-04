from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from app.database import Base
import enum
from datetime import datetime

roles = ["author", "reviewer", "editor", "layout", "admin"]


class Language(str, enum.Enum):
    kz = "kz"
    ru = "ru"
    en = "en"


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False)  # id из Auth
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_council_member = Column(Boolean, default=False)
    is_collegium_member = Column(Boolean, default=False)
    # Предпочтительный язык пользователя (для подбора рецензентов / локализации)
    preferred_language = Column(String, nullable=False, default=Language.en.value)
    academic_degrees = Column(ARRAY(String), nullable=False, default=[])
    orcid = Column(String, nullable=True)
    reviewer_science_fields = Column(ARRAY(String), nullable=False, default=[])
    reviewer_science_other = Column(String, nullable=True)

    # связи
    articles = relationship("ArticleLink", back_populates="user")
    reviews = relationship("ReviewLink", back_populates="user")

    roles = Column(ARRAY(String), default=["author"])


class RoleRequest(Base):
    __tablename__ = "role_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    requested_role = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    editor_approved = Column(Boolean, nullable=False, default=False)
    admin_approved = Column(Boolean, nullable=False, default=False)
    editor_approved_by = Column(Integer, nullable=True)
    admin_approved_by = Column(Integer, nullable=True)
    rejected_by = Column(Integer, nullable=True)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class ArticleLink(Base):
    __tablename__ = "user_articles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"))
    article_id = Column(Integer, nullable=False)
    role = Column(String, default="author")  # author, reviewer, editor

    user = relationship("UserProfile", back_populates="articles")


class ReviewLink(Base):
    __tablename__ = "user_reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"))
    review_id = Column(Integer, nullable=False)

    user = relationship("UserProfile", back_populates="reviews")
