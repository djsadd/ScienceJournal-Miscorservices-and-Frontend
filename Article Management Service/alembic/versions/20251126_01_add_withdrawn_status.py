"""Add withdrawn status to ArticleStatus enum

Revision ID: 20251126_01
Revises:
Create Date: 2025-11-26

"""
from alembic import op
from sqlalchemy import inspect

from app.database import Base
from app import models  # noqa: F401  Register metadata for create_all


# revision identifiers, used by Alembic.
revision = '20251126_01'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    table_names = set(inspector.get_table_names())

    # Fresh databases had no base Alembic revision for the articles schema.
    # Bootstrap the current schema first so later additive migrations can run idempotently.
    required_tables = {
        "authors",
        "keywords",
        "articles",
        "article_versions",
        "article_authors",
        "article_keywords",
        "article_reviewers",
    }
    if not required_tables.issubset(table_names):
        Base.metadata.create_all(bind=conn)

    op.execute("ALTER TYPE articlestatus ADD VALUE IF NOT EXISTS 'withdrawn'")


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values directly
    # You would need to recreate the enum type if you want to remove a value
    pass
