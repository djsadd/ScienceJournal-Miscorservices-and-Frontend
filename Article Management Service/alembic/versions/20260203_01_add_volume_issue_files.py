"""add issue-level file fields to volumes

Revision ID: 20260203_01_add_volume_issue_files
Revises: 20260130_01_merge_multiple_heads
Create Date: 2026-02-03
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260203_01_add_volume_issue_files"
down_revision = "20260130_01_merge_multiple_heads"
branch_labels = None
depends_on = None


def upgrade():
    try:
        op.add_column("volumes", sa.Column("complete_issue_file_url", sa.String(), nullable=True))
        op.add_column("volumes", sa.Column("cover_file_url", sa.String(), nullable=True))
        op.add_column("volumes", sa.Column("contents_file_url", sa.String(), nullable=True))
    except Exception as e:
        print(f"Migration warning: {e}")


def downgrade():
    try:
        op.drop_column("volumes", "contents_file_url")
        op.drop_column("volumes", "cover_file_url")
        op.drop_column("volumes", "complete_issue_file_url")
    except Exception as e:
        print(f"Downgrade warning: {e}")

