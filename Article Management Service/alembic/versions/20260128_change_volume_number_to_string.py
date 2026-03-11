"""change volume number to string

Revision ID: 20260128_change_volume_number
Revises: f02b17fc7620
Create Date: 2026-01-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '20260128_change_volume_number'
down_revision = 'f02b17fc7620'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = {c["name"]: c for c in inspector.get_columns("volumes")}
    column = columns.get("number")
    if column is not None and isinstance(column["type"], sa.Integer):
        op.alter_column('volumes', 'number',
                       existing_type=sa.Integer(),
                       type_=sa.String(),
                       existing_nullable=False)

def downgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = {c["name"]: c for c in inspector.get_columns("volumes")}
    column = columns.get("number")
    if column is not None and isinstance(column["type"], sa.String):
        op.alter_column('volumes', 'number',
                       existing_type=sa.String(),
                       type_=sa.Integer(),
                       existing_nullable=False)
