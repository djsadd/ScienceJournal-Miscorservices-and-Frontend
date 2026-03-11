"""add layout_file_url to articles

Revision ID: 20251201_add_layout
Revises: 20251130_04
Create Date: 2025-12-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '20251201_add_layout'
down_revision = '20251130_04'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = {c["name"] for c in inspector.get_columns("articles")}
    if "layout_file_url" not in columns:
        op.add_column('articles', sa.Column('layout_file_url', sa.String(), nullable=True))


def downgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = {c["name"] for c in inspector.get_columns("articles")}
    if "layout_file_url" in columns:
        op.drop_column('articles', 'layout_file_url')
