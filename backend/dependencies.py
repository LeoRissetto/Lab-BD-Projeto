from fastapi import Header, HTTPException


def get_userid(x_user_id: str | None = Header(default=None)) -> int:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id ausente.")
    try:
        return int(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="X-User-Id inválido.")
