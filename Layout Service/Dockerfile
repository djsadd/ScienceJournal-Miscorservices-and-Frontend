FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY wait_for_db.py ./wait_for_db.py
COPY start.sh ./start.sh
RUN chmod +x start.sh

EXPOSE 8000
CMD ["./start.sh"]
