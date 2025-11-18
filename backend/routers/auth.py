from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import hashlib
import psycopg
from database import fetch_all, get_conn
from logger import registrar_log

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginDTO(BaseModel):
    login: str
    senha: str


class RegisterDTO(BaseModel):
    login: str
    senha: str
    tipo: str
    idoriginal: str | None = None
    nome: str | None = None
    crmv: str | None = None
    especialidade: str | None = None
    clinica: str | None = None


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
                cur.execute("SELECT cpf FROM pessoa WHERE cpf=%s", (data.idoriginal,))
                cpf_exists = cur.fetchone()
                if cpf_exists is None:
                    if not data.nome:
                        raise HTTPException(
                            status_code=400,
                            detail="CPF não encontrado na tabela pessoa. Informe o campo 'nome' para criá-lo automaticamente.",
                        )
                    cur.execute(
                        """
                        INSERT INTO pessoa (cpf, nome, email)
                        VALUES (%s, %s, %s)
                        ON CONFLICT DO NOTHING
                        """,
                        (data.idoriginal, data.nome, data.login),
                    )

            try:
                cur.execute(
                    """
                    INSERT INTO users (login, senha, tipo, idoriginal)
                    VALUES (%s, %s, %s, %s)
                    RETURNING userid, login, tipo
                    """,
                    (data.login, senha_md5, data.tipo, data.idoriginal),
                )
                user = cur.fetchone()
            except psycopg.errors.UniqueViolation:
                raise HTTPException(status_code=400, detail="Login já está em uso.")

            # cria vinculação na tabela da função
            if data.idoriginal:
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

            registrar_log(conn, user["userid"])

    return {
        "userid": user["userid"],
        "login": user["login"],
        "tipo": user["tipo"],
    }
