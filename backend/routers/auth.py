from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import hashlib
import psycopg
from database import fetch_all, get_conn
from logger import registrar_log
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginDTO(BaseModel):
    login: str
    senha: str


class RegisterDTO(BaseModel):
    login: str
    senha: str
    tipo: str
    idoriginal: Optional[str] = None
    nome: Optional[str] = None
    crmv: Optional[str] = None
    especialidade: Optional[str] = None
    clinica: Optional[str] = None


def _validate_tipo(tipo: str):
    allowed = {"ADMIN", "VOLUNTARIO", "VETERINARIO"}
    if tipo not in allowed:
        raise HTTPException(status_code=400, detail="Tipo de usuário inválido.")


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
            registrar_log(conn, user["userid"])

    return {
        "userid": user["userid"],
        "login": user["login"],
        "tipo": user["tipo"],
    }


@router.post("/register")
def register(data: RegisterDTO):
    _validate_tipo(data.tipo)
    senha_md5 = hashlib.md5(data.senha.encode()).hexdigest()

    # tipos que exigem CPF
    if data.tipo in {"VOLUNTARIO", "VETERINARIO"} and not data.idoriginal:
        raise HTTPException(status_code=400, detail="CPF obrigatório para este tipo de usuário.")

    with get_conn() as conn:
        with conn.cursor() as cur:
            # valida CPF se enviado
            if data.idoriginal:
                pessoa_nome = data.nome or data.login
                cur.execute(
                    """
                    INSERT INTO pessoa (cpf, nome, email)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (cpf) DO UPDATE
                      SET nome = COALESCE(EXCLUDED.nome, pessoa.nome),
                          email = COALESCE(EXCLUDED.email, pessoa.email)
                    """,
                    (data.idoriginal, pessoa_nome, data.login),
                )

                if data.tipo == "VOLUNTARIO":
                    cur.execute(
                        "INSERT INTO voluntario (cpf) VALUES (%s) ON CONFLICT DO NOTHING",
                        (data.idoriginal,),
                    )
                elif data.tipo == "VETERINARIO":
                    if not data.crmv:
                        raise HTTPException(status_code=400, detail="CRMV é obrigatório para veterinário.")
                    cur.execute(
                        """
                        INSERT INTO veterinario (cpf, crmv, especialidade, clinica)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (cpf) DO UPDATE
                          SET crmv = EXCLUDED.crmv,
                              especialidade = EXCLUDED.especialidade,
                              clinica = EXCLUDED.clinica
                        """,
                        (data.idoriginal, data.crmv, data.especialidade, data.clinica),
                    )

            try:
                cur.execute(
                    """
                    INSERT INTO users (login, senha, tipo, idoriginal, nome, crmv, especialidade, clinica)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING userid, login, tipo
                    """,
                    (
                        data.login,
                        senha_md5,
                        data.tipo,
                        data.idoriginal,
                        data.nome,
                        data.crmv,
                        data.especialidade,
                        data.clinica,
                    ),
                )
                user = cur.fetchone()
            except psycopg.errors.UniqueViolation:
                raise HTTPException(status_code=400, detail="Login já está em uso.")

            registrar_log(conn, user["userid"])

    return {
        "userid": user["userid"],
        "login": user["login"],
        "tipo": user["tipo"],
    }
