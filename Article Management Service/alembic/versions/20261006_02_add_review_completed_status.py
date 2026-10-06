"""add review completed article status

Revision ID: 20261006_02
Revises: 20261006_01
Create Date: 2026-10-06
"""

from alembic import op


revision = "20261006_02"
down_revision = "20261006_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE articlestatus ADD VALUE IF NOT EXISTS 'review_completed'")


def downgrade() -> None:
    # PostgreSQL enum values cannot be removed safely while rows may use them.
    pass
