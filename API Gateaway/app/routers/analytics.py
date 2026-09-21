from fastapi import APIRouter, Depends, Request
from app.proxy import proxy_request
from app.config import SERVICE_URLS
from app.security import get_current_user

router = APIRouter(prefix="/analytics")

@router.get("/admin/{path:path}", dependencies=[Depends(get_current_user)])
async def admin_proxy(request: Request, path: str = ""):
    return await proxy_request(SERVICE_URLS["analytics"], request)

@router.api_route("", methods=["GET", "POST", "OPTIONS"])
@router.api_route("/", methods=["GET", "POST", "OPTIONS"])
@router.api_route("/{path:path}", methods=["GET", "POST", "OPTIONS"])
async def proxy(request: Request, path: str = ""):
    return await proxy_request(SERVICE_URLS["analytics"], request)
