"""add sort_order to volume_articles

Revision ID: 20260330_01
Revises: 20260318_01_drop_volume_year_number_uq
Create Date: 2026-03-30
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260330_01"
down_revision = "20260318_01_drop_vol_uq"
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()
    existing_columns = {
        column["name"]
        for column in sa.inspect(connection).get_columns("volume_articles")
    }

    if "sort_order" not in existing_columns:
        op.add_column(
            "volume_articles",
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        )

    connection.execute(
        sa.text(
            """
            UPDATE volume_articles
            SET sort_order = 0
            WHERE sort_order IS NULL
            """
        )
    )

    rows = connection.execute(
        sa.text(
            """
            SELECT volume_id, article_id
            FROM volume_articles
            ORDER BY volume_id ASC, article_id ASC
            """
        )
    ).fetchall()

    current_volume_id = None
    current_order = 0
    for row in rows:
        if row.volume_id != current_volume_id:
            current_volume_id = row.volume_id
            current_order = 1
        else:
            current_order += 1
        connection.execute(
            sa.text(
                """
                UPDATE volume_articles
                SET sort_order = :sort_order
                WHERE volume_id = :volume_id AND article_id = :article_id
                """
            ),
            {
                "sort_order": current_order,
                "volume_id": row.volume_id,
                "article_id": row.article_id,
            },
        )

    op.alter_column("volume_articles", "sort_order", nullable=False, server_default=None)


def downgrade() -> None:
    op.drop_column("volume_articles", "sort_order")
