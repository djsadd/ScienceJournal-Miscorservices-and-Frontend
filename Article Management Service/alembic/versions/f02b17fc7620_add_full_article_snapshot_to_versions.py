"""add_full_article_snapshot_to_versions

Revision ID: f02b17fc7620
Revises: 20251201_add_layout
Create Date: 2025-11-27 12:41:42.385191

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'f02b17fc7620'
down_revision = '20251201_add_layout'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Get existing columns
    article_versions_columns = [c['name'] for c in inspector.get_columns('article_versions')]
    table_names = inspector.get_table_names()
    
    # Add columns if they don't exist
    columns_to_add = [
        ('title_kz', sa.String()),
        ('title_en', sa.String()),
        ('title_ru', sa.String()),
        ('abstract_kz', sa.String()),
        ('abstract_en', sa.String()),
        ('abstract_ru', sa.String()),
        ('doi', sa.String()),
        ('manuscript_file_url', sa.String()),
        ('antiplagiarism_file_url', sa.String()),
        ('author_info_file_url', sa.String()),
        ('cover_letter_file_url', sa.String()),
        ('not_published_elsewhere', sa.Boolean()),
        ('plagiarism_free', sa.Boolean()),
        ('authors_agree', sa.Boolean()),
        ('generative_ai_info', sa.String()),
    ]
    
    for col_name, col_type in columns_to_add:
        if col_name not in article_versions_columns:
            op.add_column('article_versions', sa.Column(col_name, col_type, nullable=True))
    
    # Add article_type enum if not exists, then add column
    if 'article_type' not in article_versions_columns:
        try:
            op.execute("CREATE TYPE articletype_for_versions AS ENUM('original', 'review')")
        except Exception:
            pass  # Type might already exist
        op.add_column('article_versions', sa.Column('article_type', sa.String(), nullable=True))
    
    # Create article_version_authors table if not exists
    if 'article_version_authors' not in table_names:
        op.create_table('article_version_authors',
            sa.Column('version_id', sa.Integer(), nullable=False),
            sa.Column('author_id', sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(['author_id'], ['authors.id']),
            sa.ForeignKeyConstraint(['version_id'], ['article_versions.id']),
            sa.PrimaryKeyConstraint('version_id', 'author_id')
        )
    
    # Create article_version_keywords table if not exists
    if 'article_version_keywords' not in table_names:
        op.create_table('article_version_keywords',
            sa.Column('version_id', sa.Integer(), nullable=False),
            sa.Column('keyword_id', sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(['keyword_id'], ['keywords.id']),
            sa.ForeignKeyConstraint(['version_id'], ['article_versions.id']),
            sa.PrimaryKeyConstraint('version_id', 'keyword_id')
        )


def downgrade() -> None:
    op.drop_table('article_version_keywords')
    op.drop_table('article_version_authors')
    
    # Drop columns
    drop_columns = [
        'generative_ai_info',
        'authors_agree',
        'plagiarism_free',
        'not_published_elsewhere',
        'cover_letter_file_url',
        'author_info_file_url',
        'antiplagiarism_file_url',
        'manuscript_file_url',
        'article_type',
        'doi',
        'abstract_ru',
        'abstract_en',
        'abstract_kz',
        'title_ru',
        'title_en',
        'title_kz',
    ]
    
    for col in drop_columns:
        try:
            op.drop_column('article_versions', col)
        except Exception:
            pass
