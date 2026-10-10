import httpx
from fastapi import HTTPException, Request, Response
from jose import JWTError, jwt
from starlette.background import BackgroundTask
from starlette.responses import StreamingResponse
from app.config import ALGORITHM, API_PREFIX, SECRET_KEY

# Remove hop-by-hop headers so we do not forward connection-specific metadata
HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
}


def _filter_headers(headers) -> dict:
    return {
        key: value
        for key, value in headers.items()
        if key.lower() not in HOP_BY_HOP_HEADERS
    }


def _strip_api_prefix(path: str) -> str:
    prefix = (API_PREFIX or "").rstrip("/")
    if not prefix:
        return path
    if path.startswith(prefix):
        remainder = path[len(prefix):]
        if not remainder.startswith("/"):
            remainder = "/" + remainder
        return remainder or "/"
    return path


async def proxy_request(service_url: str, request: Request) -> Response:
    # The selected commission workspace is always read-only. Validate that the
    # selected role actually belongs to the authenticated token before using it.
    active_role = (request.headers.get("X-Active-Role") or "").strip().lower()
    auth_header = request.headers.get("Authorization", "")
    if auth_header:
        try:
            scheme, token = auth_header.split(" ", 1)
            if scheme.lower() != "bearer":
                raise ValueError
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            token_roles = payload.get("roles") or []
            if isinstance(token_roles, str):
                token_roles = [token_roles]
            if active_role and active_role not in token_roles:
                active_role = ""
        except HTTPException:
            raise
        except (JWTError, ValueError):
            raise HTTPException(status_code=401, detail="Invalid token")
        if "commission" in token_roles and request.method.upper() not in {"GET", "HEAD", "OPTIONS"}:
            raise HTTPException(status_code=403, detail="Commission role is read-only")

    # Start with client headers minus hop-by-hop ones
    headers = dict(_filter_headers(request.headers))

    # Always pass the upstream host so redirects don't point back to the gateway.
    try:
        upstream_host = httpx.URL(service_url).netloc
        headers["host"] = upstream_host
    except Exception:
        # If parsing fails, httpx will fill the host header from the request URL.
        headers.pop("host", None)

    # If auth middleware/dependency resolved user, forward minimal identity
    user_id = getattr(request.state, "user_id", None)
    roles = getattr(request.state, "roles", None)
    if user_id is not None:
        headers["X-User-Id"] = str(user_id)
    if roles is not None:
        # Forward roles as a simple comma-separated list
        headers["X-User-Roles"] = ",".join(roles)

    upstream_path = _strip_api_prefix(request.url.path)

    upstream_timeout = httpx.Timeout(10.0)
    if upstream_path.startswith("/files"):
        # File uploads/downloads may take longer than typical JSON API calls.
        upstream_timeout = httpx.Timeout(connect=10.0, read=120.0, write=120.0, pool=10.0)
    elif upstream_path.startswith("/ai-reviews"):
        upstream_timeout = httpx.Timeout(connect=10.0, read=130.0, write=30.0, pool=10.0)

    if upstream_path == "/ai-reviews/stream":
        client = httpx.AsyncClient(timeout=upstream_timeout)
        upstream_request = client.build_request(
            method=request.method,
            url=service_url + upstream_path,
            params=request.query_params,
            content=await request.body(),
            headers=headers,
        )
        resp = await client.send(upstream_request, stream=True)
        return StreamingResponse(
            resp.aiter_raw(),
            status_code=resp.status_code,
            headers=_filter_headers(resp.headers),
            background=BackgroundTask(client.aclose),
        )

    async with httpx.AsyncClient(timeout=upstream_timeout) as client:
        resp = await client.request(
            method=request.method,
            url=service_url + upstream_path,
            params=request.query_params,
            content=await request.body(),
            headers=headers,
            # Follow upstream redirects (e.g. trailing slash) inside the cluster so
            # browsers don't try to hit internal Docker hostnames like "articles".
            follow_redirects=not upstream_path.startswith("/auth/orcid/callback"),
        )

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=_filter_headers(resp.headers),
    )
