import os
import sys
import time
from urllib.parse import urlparse

import psycopg2
from psycopg2 import OperationalError


def wait_for_db(url: str, attempts: int = 30, delay: float = 2.0) -> None:
    last_error: Exception | None = None
    for _ in range(attempts):
        try:
            conn = psycopg2.connect(url)
            conn.close()
            return
        except OperationalError as exc:  # transient start-up errors
            last_error = exc
            time.sleep(delay)
    if last_error:
        raise last_error


def main() -> int:
    url = os.environ.get("DATABASE_URL")
    if not url:
        return 0
    parsed = urlparse(url)
    if not parsed.hostname:
        return 0
    try:
        wait_for_db(url)
        return 0
    except Exception as exc:  # pragma: no cover - start-up helper
        print(f"Database wait failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
