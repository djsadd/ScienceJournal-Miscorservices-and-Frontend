from fastapi import Header, HTTPException
from jose import JWTError, jwt

from app.config import ALGORITHM, SECRET_KEY


def get_current_editor(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        payload = jwt.decode(authorization.split(" ", 1)[1], SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
        roles = payload.get("roles") or []
    except (JWTError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    if not ({"editor", "admin"} & set(roles)):
        raise HTTPException(status_code=403, detail="Editor or admin role required")
    return {"user_id": user_id, "roles": roles}

