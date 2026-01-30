"""Merge multiple heads (authors.email migrations)

Revision ID: 20260130_01_merge_multiple_heads
Revises: 20260128_rm_auth_email_uq, 20260129_01
Create Date: 2026-01-30
"""

# Alembic merge revision: brings divergent heads back into a single linear history.

from alembic import op  # noqa: F401

# revision identifiers, used by Alembic.
revision = "20260130_01_merge_multiple_heads"
down_revision = ("20260128_rm_auth_email_uq", "20260129_01")
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
