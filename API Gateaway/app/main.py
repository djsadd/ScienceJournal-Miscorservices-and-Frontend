from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import API_PREFIX
from app.routers import (
    auth,
    users,
    articles,
    reviews,
    editorial,
    layout,
    publication,
    notifications,
    analytics,
    fileprocessing,
    volumes,
)

app = FastAPI(
    title="API Gateway",
    docs_url=f"{API_PREFIX}/docs",
    openapi_url=f"{API_PREFIX}/openapi.json",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(articles.router, prefix=API_PREFIX)
app.include_router(reviews.router, prefix=API_PREFIX)
app.include_router(editorial.router, prefix=API_PREFIX)
app.include_router(layout.router, prefix=API_PREFIX)
app.include_router(publication.router, prefix=API_PREFIX)
app.include_router(notifications.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(fileprocessing.router, prefix=API_PREFIX)
app.include_router(volumes.router, prefix=API_PREFIX)
