from fastapi import APIRouter, HTTPException, Request
from app.proxy import proxy_request
from app.config import SERVICE_URLS

router = APIRouter(prefix="/reviews")


# Service-to-service endpoints of the Review Service that have no auth of their
# own. They must not be reachable from the internet:
#   - POST /reviews/assign           (Article Service creates reviewer assignments)
#   - GET  /reviews/article/{id}     (reveals reviewer identities -> breaks blind review;
#                                     the public equivalent is /api/articles/{id}/reviewers)
@router.post("/assign")
async def block_assign():
    raise HTTPException(status_code=404, detail="Not Found")


@router.get("/article/{path:path}")
async def block_article_reviews(path: str):
    raise HTTPException(status_code=404, detail="Not Found")


# Accept both /api/reviews and /api/reviews/... without redirect
@router.api_route("", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
@router.api_route("/", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy(request: Request, path: str = ""):
    return await proxy_request(SERVICE_URLS["reviews"], request)
