from fastapi import FastAPI
from app.database import Base, engine
from app.routers.notifications import router as notifications_router
from app.routers.author import router as author_notifications_router
from app.routers.reviewer import router as reviewer_notifications_router
from app.routers.editor import router as editor_notifications_router

app = FastAPI(title="Notification Service")

# Initialize database tables
Base.metadata.create_all(bind=engine)

app.include_router(notifications_router)
app.include_router(author_notifications_router)
app.include_router(reviewer_notifications_router)
app.include_router(editor_notifications_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
