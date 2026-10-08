CREATE TABLE IF NOT EXISTS editorial_members (
    id SERIAL PRIMARY KEY,
    "group" VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    status VARCHAR,
    workplace VARCHAR,
    citizenship VARCHAR,
    h_index_wos INTEGER,
    h_index_scopus INTEGER,
    orcid VARCHAR,
    scopus_author_id VARCHAR,
    researcher_id VARCHAR,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT editorial_members_group_check CHECK ("group" IN ('collegium', 'council')),
    CONSTRAINT editorial_members_h_index_wos_check CHECK (h_index_wos IS NULL OR h_index_wos >= 0),
    CONSTRAINT editorial_members_h_index_scopus_check CHECK (h_index_scopus IS NULL OR h_index_scopus >= 0)
);

CREATE INDEX IF NOT EXISTS ix_editorial_members_group ON editorial_members ("group");
