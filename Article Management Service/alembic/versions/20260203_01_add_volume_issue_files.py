"""add issue-level file fields to volumes

Revision ID: 20260203_01_vol_issue_files
Revises: 20260130_01_merge_multiple_heads
Create Date: 2026-02-03
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260203_01_vol_issue_files"
down_revision = "20260130_01_merge_multiple_heads"
branch_labels = None
depends_on = None


def upgrade():
    for name in ("complete_issue_file_url", "cover_file_url", "contents_file_url"):
        try:
            op.add_column("volumes", sa.Column(name, sa.String(), nullable=True))
        except Exception as e:
            # If the column already exists (e.g. a partial/failed prior run), continue.
            print(f"Migration warning ({name}): {e}")


def downgrade():
    for name in ("contents_file_url", "cover_file_url", "complete_issue_file_url"):
        try:
            op.drop_column("volumes", name)
        except Exception as e:
            print(f"Downgrade warning ({name}): {e}")
