"""initial layout_records table

Revision ID: 0001_initial
Revises: 
Create Date: 2025-12-02
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'layout_records',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('article_id', sa.Integer(), nullable=True),
        sa.Column('volume_id', sa.Integer(), nullable=True),
        sa.Column('file_id', sa.String(), nullable=True),
        sa.Column('file_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_table('layout_records')
