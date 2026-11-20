from fastapi import APIRouter, HTTPException, Request
from app.proxy import proxy_request
from app.config import SERVICE_URLS
from app.security import get_current_user

router = APIRouter(prefix="/files")

# The File Storage Service has no authentication of its own, so the gateway is
# the only line of defence for it:
#   - GET  /files/{id}, /files/{id}/download, /files/{id}/view stay public:
#     file ids are random UUIDs and published articles link to them directly.
#   - Listing all files would reveal every id (unpublished manuscripts, reviews),
#     so it is not exposed publicly.
#   - Uploads require a logged-in user.
#   - Deletion is not exposed publicly (only used inside the Docker network).


def _is_listing(path: str) -> bool:
    return path.strip("/") == ""


# Accept both /api/files and /api/files/... without FastAPI adding a redirect that
# breaks streaming uploads in the browser.
@router.api_route("", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
@router.api_route("/", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy(request: Request, path: str = ""):
    method = request.method.upper()

    if method == "OPTIONS":
        return await proxy_request(SERVICE_URLS["files"], request)

    if method == "GET":
        if _is_listing(path):
            raise HTTPException(status_code=404, detail="Not Found")
        return await proxy_request(SERVICE_URLS["files"], request)

    if method == "DELETE":
        raise HTTPException(status_code=405, detail="Method Not Allowed")

    # POST / PUT / PATCH: authenticated users only
    await get_current_user(request)
    return await proxy_request(SERVICE_URLS["files"], request)
