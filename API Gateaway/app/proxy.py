import httpx
from fastapi import Request, Response
from app.config import API_PREFIX

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

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.request(
            method=request.method,
            url=service_url + upstream_path,
            params=request.query_params,
            content=await request.body(),
            headers=headers,
            # Follow upstream redirects (e.g. trailing slash) inside the cluster so
            # browsers don't try to hit internal Docker hostnames like "articles".
            follow_redirects=True,
        )

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=_filter_headers(resp.headers),
    )
