"""remove unique constraint from authors.email

Revision ID: 20260128_rm_auth_email_uq
Revises: 20260128_change_volume_number
Create Date: 2026-01-28
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260128_rm_auth_email_uq"
down_revision = "20260128_change_volume_number"
branch_labels = None
depends_on = None


def upgrade():
    try:
        bind = op.get_bind()
        dialect = getattr(getattr(bind, "dialect", None), "name", None)

        # Most common Postgres default name for UNIQUE(email) on table "authors"
        if dialect == "postgresql":
            op.execute("ALTER TABLE authors DROP CONSTRAINT IF EXISTS authors_email_key")
            op.execute("ALTER TABLE authors DROP CONSTRAINT IF EXISTS uq_authors_email")
            return

        # Best-effort for other dialects / naming conventions
        try:
            op.drop_constraint("authors_email_key", "authors", type_="unique")
        except Exception:
            pass
        try:
            op.drop_constraint("uq_authors_email", "authors", type_="unique")
        except Exception:
            pass
    except Exception as e:
        print(f"Migration warning: {e}")


def downgrade():
    try:
        bind = op.get_bind()
        dialect = getattr(getattr(bind, "dialect", None), "name", None)

        # Note: will fail if duplicate emails already exist.
        if dialect == "postgresql":
            op.execute("ALTER TABLE authors ADD CONSTRAINT authors_email_key UNIQUE (email)")
            return

        op.create_unique_constraint("authors_email_key", "authors", ["email"])
    except Exception as e:
        print(f"Downgrade warning: {e}")

