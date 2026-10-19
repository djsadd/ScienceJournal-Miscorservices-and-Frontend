"""add multilingual author names and affiliations

Revision ID: 20261019_01
Revises: 20261006_02
Create Date: 2026-10-19
"""

from alembic import op
import sqlalchemy as sa


revision = "20261019_01"
down_revision = "20261006_02"
branch_labels = None
depends_on = None


FIELDS = (
    "first_name_en", "first_name_ru", "first_name_kz",
    "patronymic_en", "patronymic_ru", "patronymic_kz",
    "last_name_en", "last_name_ru", "last_name_kz",
    "affiliation1_en", "affiliation1_ru", "affiliation1_kz",
    "affiliation2_en", "affiliation2_ru", "affiliation2_kz",
    "affiliation3_en", "affiliation3_ru", "affiliation3_kz",
)


def upgrade() -> None:
    for field in FIELDS:
        op.add_column("authors", sa.Column(field, sa.String(), nullable=True))
    # Legacy records have no language marker. Keep them available as English
    # fallback until an author or editor supplies explicit translations.
    op.execute("""
        UPDATE authors SET
          first_name_en = first_name,
          patronymic_en = patronymic,
          last_name_en = last_name,
          affiliation1_en = affiliation1,
          affiliation2_en = affiliation2,
          affiliation3_en = affiliation3
    """)


def downgrade() -> None:
    for field in reversed(FIELDS):
        op.drop_column("authors", field)
