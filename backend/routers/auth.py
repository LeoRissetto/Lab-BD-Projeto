from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import hashlib
from database import fetch_all, get_conn

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginDTO(BaseModel):
    login: str
    senha: str


@router.post("/login")
def login(data: LoginDTO):
    senha_md5 = hashlib.md5(data.senha.encode()).hexdigest()

    user = fetch_all(
        "SELECT userid, login, tipo FROM users WHERE login=%s AND senha=%s",
        (data.login, senha_md5),
    )

    if not user:
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")

    user = user[0]

    # registra log via trigger
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET tipo = tipo WHERE userid=%s",
                (user["userid"],),
            )

    return {
        "userid": user["userid"],
        "login": user["login"],
        "tipo": user["tipo"],
    }
