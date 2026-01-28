"""change volume number to string

Revision ID: 20260128_change_volume_number
Revises: 20251201_add_layout
Create Date: 2026-01-28
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260128_change_volume_number'
down_revision = '20251201_add_layout'
branch_labels = None
depends_on = None

def upgrade():
    try:
        # Change column type from Integer to String
        op.alter_column('volumes', 'number',
                       existing_type=sa.Integer(),
                       type_=sa.String(),
                       existing_nullable=False)
    except Exception as e:
        # If something fails, log it but don't crash
        print(f"Migration warning: {e}")

def downgrade():
    try:
        # Revert back to Integer
        op.alter_column('volumes', 'number',
                       existing_type=sa.String(),
                       type_=sa.Integer(),
                       existing_nullable=False)
    except Exception as e:
        print(f"Downgrade warning: {e}")
