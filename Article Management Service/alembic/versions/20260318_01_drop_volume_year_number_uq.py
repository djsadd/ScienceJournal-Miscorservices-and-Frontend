"""drop volumes(year, number) unique constraint

Revision ID: 20260318_01_drop_volume_year_number_uq
Revises: 20260312_01
Create Date: 2026-03-18
"""

from alembic import op
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "20260318_01_drop_volume_year_number_uq"
down_revision = "20260312_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    if "volumes" not in inspector.get_table_names():
        return

    for constraint in inspector.get_unique_constraints("volumes"):
        columns = constraint.get("column_names") or []
        name = constraint.get("name")
        if columns == ["year", "number"] or set(columns) == {"year", "number"} or name == "uq_volumes_year_number":
            op.drop_constraint(name or "uq_volumes_year_number", "volumes", type_="unique")
            break


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    if "volumes" not in inspector.get_table_names():
        return

    for constraint in inspector.get_unique_constraints("volumes"):
        columns = constraint.get("column_names") or []
        if columns == ["year", "number"] or set(columns) == {"year", "number"}:
            return

    op.create_unique_constraint("uq_volumes_year_number", "volumes", ["year", "number"])
