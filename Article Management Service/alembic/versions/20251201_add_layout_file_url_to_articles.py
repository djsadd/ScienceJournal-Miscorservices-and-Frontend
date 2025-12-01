"""add layout_file_url to articles

Revision ID: 20251201_add_layout
Revises: 
Create Date: 2025-12-01
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251201_add_layout'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    try:
        op.add_column('articles', sa.Column('layout_file_url', sa.String(), nullable=True))
    except Exception:
        # If column already exists (idempotency), ignore
        pass


def downgrade():
    try:
        op.drop_column('articles', 'layout_file_url')
    except Exception:
        pass
