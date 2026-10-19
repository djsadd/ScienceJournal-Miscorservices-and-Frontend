"""add layout workflow tasks

Revision ID: 0002_layout_tasks
Revises: 0001_initial
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_layout_tasks"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "layout_tasks",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("article_id", sa.Integer(), nullable=False),
        sa.Column("article_title", sa.String(), nullable=False),
        sa.Column("editor_id", sa.Integer(), nullable=False),
        sa.Column("layout_user_id", sa.Integer(), nullable=True),
        sa.Column("source_file_id", sa.String(), nullable=True),
        sa.Column("source_file_url", sa.String(), nullable=True),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("result_record_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_layout_tasks_article_id", "layout_tasks", ["article_id"])
    op.create_index("ix_layout_tasks_editor_id", "layout_tasks", ["editor_id"])
    op.create_index("ix_layout_tasks_layout_user_id", "layout_tasks", ["layout_user_id"])
    op.create_index("ix_layout_tasks_status", "layout_tasks", ["status"])


def downgrade():
    op.drop_table("layout_tasks")
