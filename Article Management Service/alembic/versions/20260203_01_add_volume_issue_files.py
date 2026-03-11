"""add issue-level file fields to volumes

Revision ID: 20260203_01_vol_issue_files
Revises: 20260130_01_merge_multiple_heads
Create Date: 2026-02-03
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "20260203_01_vol_issue_files"
down_revision = "20260130_01_merge_multiple_heads"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = {c["name"] for c in inspector.get_columns("volumes")}
    for name in ("complete_issue_file_url", "cover_file_url", "contents_file_url"):
        if name not in columns:
            op.add_column("volumes", sa.Column(name, sa.String(), nullable=True))


def downgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = {c["name"] for c in inspector.get_columns("volumes")}
    for name in ("contents_file_url", "cover_file_url", "complete_issue_file_url"):
        if name in columns:
            op.drop_column("volumes", name)
