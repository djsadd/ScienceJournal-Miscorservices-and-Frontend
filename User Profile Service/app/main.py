from fastapi import FastAPI
from app.users_router import router as users_router
from sqlalchemy import inspect, text
from app.database import Base, engine

app = FastAPI(title="User Profile Service")

# создаём таблицы (можно убрать после миграций)
Base.metadata.create_all(bind=engine)

def ensure_editorial_member_translations() -> None:
    columns = {column["name"] for column in inspect(engine).get_columns("editorial_members")}
    with engine.begin() as connection:
        for base in ("full_name", "status", "workplace", "citizenship"):
            for lang in ("ru", "kz", "en"):
                column = f"{base}_{lang}"
                if column not in columns:
                    connection.execute(text(f'ALTER TABLE editorial_members ADD COLUMN {column} VARCHAR'))
                connection.execute(text(f'UPDATE editorial_members SET {column} = {base} WHERE {column} IS NULL'))

ensure_editorial_member_translations()

app.include_router(users_router)
