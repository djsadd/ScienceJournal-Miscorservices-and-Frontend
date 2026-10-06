"""add volume planning fields

Revision ID: 20261006_01
Revises: a44b0249a878
Create Date: 2026-10-06
"""

from alembic import op
import sqlalchemy as sa


revision = "20261006_01"
down_revision = "a44b0249a878"
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()
    columns = {column["name"] for column in sa.inspect(connection).get_columns("volumes")}
    if "planned_publication_date" not in columns:
        op.add_column("volumes", sa.Column("planned_publication_date", sa.Date(), nullable=True))
    if "target_article_count" not in columns:
        op.add_column("volumes", sa.Column("target_article_count", sa.Integer(), nullable=True))


def downgrade() -> None:
    connection = op.get_bind()
    columns = {column["name"] for column in sa.inspect(connection).get_columns("volumes")}
    if "target_article_count" in columns:
        op.drop_column("volumes", "target_article_count")
    if "planned_publication_date" in columns:
        op.drop_column("volumes", "planned_publication_date")
