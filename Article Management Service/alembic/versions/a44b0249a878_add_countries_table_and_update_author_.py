"""add countries table and update author country field

Revision ID: a44b0249a878
Revises: 20260330_02
Create Date: 2026-04-24 12:40:27.692309

"""
from alembic import op
import sqlalchemy as sa
import pycountry


# revision identifiers, used by Alembic.
revision = 'a44b0249a878'
down_revision = '20260330_02'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create countries table
    op.create_table('countries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('alpha_2', sa.String(length=2), nullable=False),
        sa.Column('alpha_3', sa.String(length=3), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_countries_id', 'id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('alpha_2'),
        sa.UniqueConstraint('alpha_3')
    )

    # Insert countries data
    countries_data = []
    for country in pycountry.countries:
        countries_data.append({
            'name': country.name,
            'alpha_2': country.alpha_2,
            'alpha_3': country.alpha_3
        })
    op.bulk_insert(sa.table('countries', 
        sa.Column('name', sa.String()), 
        sa.Column('alpha_2', sa.String(length=2)), 
        sa.Column('alpha_3', sa.String(length=3))
    ), countries_data)

    # Add country_id column to authors
    op.add_column('authors', sa.Column('country_id', sa.Integer(), nullable=True))

    # Set country_id to Kazakhstan for existing authors
    op.execute("UPDATE authors SET country_id = (SELECT id FROM countries WHERE alpha_3 = 'KAZ')")

    # Make country_id not nullable
    op.alter_column('authors', 'country_id', nullable=False)

    # Drop old country column
    op.drop_column('authors', 'country')

    # Add foreign key
    op.create_foreign_key('fk_authors_country_id', 'authors', 'countries', ['country_id'], ['id'])


def downgrade() -> None:
    # Remove foreign key
    op.drop_constraint('fk_authors_country_id', 'authors', type_='foreignkey')

    # Add back old country column
    op.add_column('authors', sa.Column('country', sa.String(), nullable=True))

    # Set country to 'Kazakhstan' for existing authors (approximation)
    op.execute("UPDATE authors SET country = 'Kazakhstan'")

    # Make country not nullable
    op.alter_column('authors', 'country', nullable=False)

    # Drop country_id column
    op.drop_column('authors', 'country_id')

    # Drop countries table
    op.drop_table('countries')
