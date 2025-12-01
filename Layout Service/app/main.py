import os
from fastapi import FastAPI
from app.router import router as layout_router
from app.database import Base, engine

FILE_SERVICE_URL = os.getenv("FILE_SERVICE_URL", "http://fileprocessing:7000")

app = FastAPI(title="Layout Service")
app.include_router(layout_router)

# Ensure tables exist
Base.metadata.create_all(bind=engine)


@app.get("/health")
async def health():
    return {"status": "ok", "file_service": FILE_SERVICE_URL}
