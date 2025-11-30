from fastapi import APIRouter, Request
from app.proxy import proxy_request
from app.config import SERVICE_URLS

router = APIRouter(prefix="/reviews")

# Accept both /api/reviews and /api/reviews/... without redirect
@router.api_route("", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
@router.api_route("/", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy(request: Request, path: str = ""):
    return await proxy_request(SERVICE_URLS["reviews"], request)
