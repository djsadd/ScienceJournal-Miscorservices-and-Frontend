"""add article_language to articles and versions

Revision ID: 20260330_02
Revises: 20260330_01
Create Date: 2026-03-30
"""

from alembic import op
import sqlalchemy as sa


revision = "20260330_02"
down_revision = "20260330_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("articles", sa.Column("article_language", sa.String(), nullable=True))
    op.add_column("article_versions", sa.Column("article_language", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("article_versions", "article_language")
    op.drop_column("articles", "article_language")
