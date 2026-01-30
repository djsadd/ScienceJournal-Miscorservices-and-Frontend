"""Make authors.email non-unique

Revision ID: 20260129_01
Revises: 20260128_change_volume_number
Create Date: 2026-01-29
"""

from alembic import op
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "20260129_01"
down_revision = "20260128_change_volume_number"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    if "authors" not in inspector.get_table_names():
        return

    unique_constraints = inspector.get_unique_constraints("authors")
    email_unique_names: list[str] = []
    for constraint in unique_constraints:
        column_names = constraint.get("column_names") or []
        if "email" in column_names:
            name = constraint.get("name")
            if name:
                email_unique_names.append(name)

    if email_unique_names:
        with op.batch_alter_table("authors") as batch_op:
            for name in email_unique_names:
                try:
                    batch_op.drop_constraint(name, type_="unique")
                except Exception as exc:
                    print(f"Migration warning: failed to drop unique constraint {name!r}: {exc}")

    existing_indexes = {idx.get("name") for idx in inspector.get_indexes("authors")}
    if "ix_authors_email" not in existing_indexes:
        try:
            op.create_index("ix_authors_email", "authors", ["email"], unique=False)
        except Exception as exc:
            print(f"Migration warning: failed to create index ix_authors_email: {exc}")


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    if "authors" not in inspector.get_table_names():
        return

    try:
        with op.batch_alter_table("authors") as batch_op:
            batch_op.create_unique_constraint("uq_authors_email", ["email"])
    except Exception as exc:
        # May fail if duplicates already exist.
        print(f"Downgrade warning: failed to create unique constraint on authors.email: {exc}")

