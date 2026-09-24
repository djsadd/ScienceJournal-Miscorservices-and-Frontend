from fastapi import FastAPI
from sqlalchemy import inspect, text

from app.database import Base, engine
from app.router import router

app = FastAPI(title="AI Review Service", version="1.0.0")


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)
    # Migrate installations created before AI reviews started sharing the
    # reviews database. Their column may incorrectly reference reviewstatus.
    inspector = inspect(engine)
    if "ai_reviews" in inspector.get_table_names():
        status_column = next((column for column in inspector.get_columns("ai_reviews") if column["name"] == "status"), None)
        if status_column is not None and status_column["type"].__class__.__name__.lower() == "enum":
            with engine.begin() as connection:
                connection.execute(text(
                    "ALTER TABLE ai_reviews ALTER COLUMN status TYPE VARCHAR(32) USING status::text"
                ))


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(router)
