"""Fix article_reviewers primary key to allow multiple reviewers per article

Revision ID: 20260312_01
Revises: 20251129_01
Create Date: 2026-03-12

"""

from alembic import op
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "20260312_01"
down_revision = "20251129_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    if "article_reviewers" not in inspector.get_table_names():
        return

    pk = inspector.get_pk_constraint("article_reviewers")
    constrained_columns = pk.get("constrained_columns") or []

    if constrained_columns == ["article_id", "user_id"]:
        return

    pk_name = pk.get("name") or "article_reviewers_pkey"
    op.drop_constraint(pk_name, "article_reviewers", type_="primary")
    op.create_primary_key("article_reviewers_pkey", "article_reviewers", ["article_id", "user_id"])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    if "article_reviewers" not in inspector.get_table_names():
        return

    pk = inspector.get_pk_constraint("article_reviewers")
    pk_name = pk.get("name") or "article_reviewers_pkey"
    constrained_columns = pk.get("constrained_columns") or []

    if constrained_columns != ["article_id"]:
        op.drop_constraint(pk_name, "article_reviewers", type_="primary")
        op.create_primary_key("article_reviewers_pkey", "article_reviewers", ["article_id"])
