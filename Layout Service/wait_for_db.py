import os
import time
import psycopg2
from psycopg2 import OperationalError

DB_USER = os.getenv("DB_USER", "layout")
DB_PASSWORD = os.getenv("DB_PASSWORD", "pass")
DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "layout")
DATABASE_URL = os.getenv("DATABASE_URL")

# If full URL provided, parse quickly (simple split, not robust URI parser)
if DATABASE_URL and DATABASE_URL.startswith("postgres"):
    # Expect form postgresql://user:pass@host:port/db
    try:
        creds_and_host = DATABASE_URL.split("//", 1)[1]
        auth, rest = creds_and_host.split("@", 1)
        user, pwd = auth.split(":", 1)
        host_port, db = rest.rsplit("/", 1)
        if ":" in host_port:
            host, port = host_port.split(":", 1)
        else:
            host, port = host_port, DB_PORT
        DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME = user, pwd, host, port, db
    except Exception:
        pass  # fall back to component env vars

MAX_ATTEMPTS = int(os.getenv("DB_MAX_ATTEMPTS", "30"))
SLEEP_SECONDS = float(os.getenv("DB_RETRY_SLEEP", "2"))

for attempt in range(1, MAX_ATTEMPTS + 1):
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
        )
        conn.close()
        print(f"[wait_for_db] Connected to {DB_HOST}:{DB_PORT}/{DB_NAME} as {DB_USER} on attempt {attempt}.")
        break
    except OperationalError as e:
        print(f"[wait_for_db] Attempt {attempt} failed: {e}")
        if attempt == MAX_ATTEMPTS:
            print("[wait_for_db] Exiting after max attempts.")
            raise SystemExit(1)
        time.sleep(SLEEP_SECONDS)
