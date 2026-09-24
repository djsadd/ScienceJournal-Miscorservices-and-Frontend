from fastapi import APIRouter, Request

from app.config import SERVICE_URLS
from app.proxy import proxy_request

router = APIRouter(prefix="/ai-reviews")


@router.api_route("", methods=["GET", "POST", "OPTIONS"])
@router.api_route("/", methods=["GET", "POST", "OPTIONS"])
@router.api_route("/{path:path}", methods=["GET", "POST", "OPTIONS"])
async def proxy(request: Request, path: str = ""):
    return await proxy_request(SERVICE_URLS["ai_reviews"], request)
