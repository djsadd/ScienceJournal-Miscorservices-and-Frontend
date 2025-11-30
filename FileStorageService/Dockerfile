FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY alembic.ini ./alembic.ini
COPY alembic ./alembic
COPY wait_for_db.py ./wait_for_db.py

VOLUME ["/app/storage"]

EXPOSE 7000
CMD ["sh", "-c", "python /app/wait_for_db.py && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 7000"]
