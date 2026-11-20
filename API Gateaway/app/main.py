import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import API_PREFIX
from app.routers import (
    auth,
    users,
    articles,
    countries,
    reviews,
    editorial,
    layout,
    publication,
    notifications,
    analytics,
    fileprocessing,
    volumes,
    ai_reviews,
)

ENABLE_API_DOCS = os.getenv("ENABLE_API_DOCS", "false").strip().lower() in {"1", "true", "yes"}

app = FastAPI(
    title="API Gateway",
    docs_url=f"{API_PREFIX}/docs" if ENABLE_API_DOCS else None,
    openapi_url=f"{API_PREFIX}/openapi.json" if ENABLE_API_DOCS else None,
    redoc_url=None,
)


@app.middleware("http")
async def block_internal_routes(request: Request, call_next):
    # Service-to-service endpoints (/<service>/internal/...) must never be
    # reachable from outside the Docker network.
    if "internal" in request.url.path.lower().split("/"):
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # Auth uses Bearer tokens, not cookies, so credentialed CORS is not needed.
    # Wildcard origin + credentials would let any site make authenticated calls.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(articles.router, prefix=API_PREFIX)
app.include_router(countries.router, prefix=API_PREFIX)
app.include_router(reviews.router, prefix=API_PREFIX)
app.include_router(editorial.router, prefix=API_PREFIX)
app.include_router(layout.router, prefix=API_PREFIX)
app.include_router(publication.router, prefix=API_PREFIX)
app.include_router(notifications.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(fileprocessing.router, prefix=API_PREFIX)
app.include_router(volumes.router, prefix=API_PREFIX)
app.include_router(ai_reviews.router, prefix=API_PREFIX)
