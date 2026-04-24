import logging
import os
import sys
import time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response

from app.articles_router import router as articles_router
from app.volumes_router import router as volumes_router
from app.countries_router import router as countries_router
from app.database import Base, engine
from app import models  # register models for metadata
from alembic.config import Config
from alembic import command

app = FastAPI(title="Article Management Service")


def run_migrations():
    """Run alembic migrations on startup"""
    try:
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        logging.getLogger("articles.migrations").info("Migrations applied successfully")
    except Exception as e:
        logging.getLogger("articles.migrations").exception("Migration error: %s", e)
        # If migrations fail, fallback to create_all
        Base.metadata.create_all(bind=engine)


def _configure_logging():
    level = os.getenv("LOG_LEVEL", "INFO").upper()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s"))

    logging.basicConfig(level=level, handlers=[handler], force=True)

    # Make sure our app loggers are visible even if a server log config toggles them.
    for logger_name, logger_obj in list(logging.Logger.manager.loggerDict.items()):
        if isinstance(logger_obj, logging.Logger) and logger_name.startswith("articles"):
            logger_obj.disabled = False
            logger_obj.propagate = True


_configure_logging()


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start = time.perf_counter()
    try:
        response: Response = await call_next(request)
    except Exception:
        logging.getLogger("articles.requests").exception(
            "Unhandled error on %s %s", request.method, request.url.path
        )
        raise
    finally:
        duration_ms = (time.perf_counter() - start) * 1000
        logging.getLogger("articles.requests").info(
            "%s %s -> %s (%.1fms)",
            request.method,
            request.url.path,
            getattr(locals().get("response", None), "status_code", "ERR"),
            duration_ms,
        )
    return response


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    # By default FastAPI won't log handled HTTP errors; for debugging it is useful to see them in `docker logs`.
    logging.getLogger("articles.http").warning(
        "%s %s -> %s detail=%s",
        request.method,
        request.url.path,
        exc.status_code,
        getattr(exc, "detail", None),
    )
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logging.getLogger("articles.validation").warning(
        "%s %s -> 422 errors=%s",
        request.method,
        request.url.path,
        exc.errors(),
    )
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.on_event("startup")
def on_startup():
    # entrypoint.sh already runs migrations in Docker; keep optional for non-docker runs.
    if os.getenv("RUN_MIGRATIONS_ON_STARTUP", "0") == "1":
        run_migrations()
    logging.getLogger("articles.startup").info("Startup complete")

app.include_router(articles_router)
app.include_router(volumes_router)
app.include_router(countries_router)
