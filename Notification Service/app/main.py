from fastapi import FastAPI
from app.database import Base, engine, SessionLocal
from sqlalchemy import text
from app.routers.notifications import router as notifications_router, _ensure_default_templates
from app.routers.author import router as author_notifications_router
from app.routers.reviewer import router as reviewer_notifications_router
from app.routers.editor import router as editor_notifications_router

app = FastAPI(title="Notification Service")

# Initialize database tables and ensure new columns exist
Base.metadata.create_all(bind=engine)

# Ensure optional attachment columns exist for notifications
with engine.begin() as conn:
    conn.execute(text(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='notifications' AND column_name='article_id'
            ) THEN
                ALTER TABLE notifications ADD COLUMN article_id INTEGER;
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='notifications' AND column_name='article_version_id'
            ) THEN
                ALTER TABLE notifications ADD COLUMN article_version_id INTEGER;
            END IF;
            IF EXISTS (
                SELECT 1 FROM information_schema.tables WHERE table_name='email_templates'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='email_templates' AND column_name='key'
            ) THEN
                ALTER TABLE email_templates ADD COLUMN key VARCHAR;
                UPDATE email_templates SET key = 'notification_' || type::text WHERE key IS NULL;
                CREATE UNIQUE INDEX IF NOT EXISTS ix_email_templates_key ON email_templates (key);
            END IF;
            IF EXISTS (
                SELECT 1 FROM information_schema.tables WHERE table_name='email_templates'
            ) THEN
                ALTER TABLE email_templates ALTER COLUMN type DROP NOT NULL;
            END IF;
        END$$;
        """
    ))

with SessionLocal() as db:
    _ensure_default_templates(db)

app.include_router(notifications_router)
app.include_router(author_notifications_router)
app.include_router(reviewer_notifications_router)
app.include_router(editor_notifications_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
