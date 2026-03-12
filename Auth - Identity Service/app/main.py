from fastapi import FastAPI
from sqlalchemy import inspect, text

from app.auth_router import router as auth_router
from app.database import Base, engine

app = FastAPI(title="Auth Service")

# СЃРѕР·РґР°РµРј С‚Р°Р±Р»РёС†С‹ (РјРѕР¶РЅРѕ СѓР±СЂР°С‚СЊ РїРѕСЃР»Рµ РјРёРіСЂР°С†РёР№)
Base.metadata.create_all(bind=engine)


def ensure_user_hidden_column() -> None:
    inspector = inspect(engine)
    try:
        columns = {column["name"] for column in inspector.get_columns("users")}
    except Exception:
        return

    if "is_hidden" in columns:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE"))


ensure_user_hidden_column()

app.include_router(auth_router)
