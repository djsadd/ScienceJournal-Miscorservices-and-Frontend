-- Migration: add role self-service requests
CREATE TABLE IF NOT EXISTS role_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    requested_role VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    editor_approved BOOLEAN NOT NULL DEFAULT FALSE,
    admin_approved BOOLEAN NOT NULL DEFAULT FALSE,
    editor_approved_by INTEGER,
    admin_approved_by INTEGER,
    rejected_by INTEGER,
    rejection_reason VARCHAR,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_role_requests_user_id ON role_requests(user_id);
CREATE INDEX IF NOT EXISTS ix_role_requests_status ON role_requests(status);
