from fastapi import APIRouter, HTTPException
import psycopg
from pydantic import BaseModel
from typing import Optional
from database import get_conn

router = APIRouter(prefix="/veterinarios", tags=["Veterinários"])


class PessoaDTO(BaseModel):
    cpf: str
    nome: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    endereco_id: Optional[int] = None


class VeterinarioDTO(BaseModel):
    cpf: str
    crmv: str
    especialidade: Optional[str] = None
    clinica: Optional[str] = None


class CriarVeterinarioDTO(PessoaDTO):
    crmv: str
    especialidade: Optional[str] = None
    clinica: Optional[str] = None


class AtualizarVeterinarioDTO(BaseModel):
    nome: Optional[str]
    telefone: Optional[str]
    email: Optional[str]
    endereco_id: Optional[int]
    especialidade: Optional[str]
    clinica: Optional[str]


@router.get("/")
def listar_veterinarios(role: str = "PUBLIC"):
    role_upper = role.upper()
    if role_upper == "VETERINARIO":
        return []

    sql_view = "SELECT * FROM vw_veterinarios_visao ORDER BY nome"
    sql_fallback = """
        SELECT v.cpf, p.nome, p.telefone, p.email, p.endereco_id,
               v.crmv, v.especialidade, v.clinica
          FROM veterinario v
          JOIN pessoa p ON p.cpf = v.cpf
      ORDER BY p.nome;
    """

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(f"SET LOCAL app.tipo_usuario = '{role_upper}'")
            try:
                cur.execute(sql_view)
                return cur.fetchall()
            except psycopg.errors.UndefinedTable:
                cur.execute(sql_fallback)
                return cur.fetchall()


@router.post("/")
def criar_veterinario(data: CriarVeterinarioDTO):
    pessoa_values = (data.cpf, data.nome, data.telefone, data.email, data.endereco_id)
    vet_values = (data.cpf, data.crmv, data.especialidade, data.clinica)

    with get_conn() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(
                    "INSERT INTO pessoa (cpf, nome, telefone, email, endereco_id) VALUES (%s, %s, %s, %s, %s)",
                    pessoa_values,
                )
                cur.execute(
                    "INSERT INTO veterinario (cpf, crmv, especialidade, clinica) VALUES (%s, %s, %s, %s)",
                    vet_values,
                )
            except Exception as e:
                conn.rollback()
                raise HTTPException(status_code=400, detail=str(e))

    return {"status": "veterinário criado", "cpf": data.cpf}


@router.put("/{cpf}")
def atualizar_veterinario(cpf: str, data: AtualizarVeterinarioDTO):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE pessoa
                   SET nome=%s, telefone=%s, email=%s, endereco_id=%s
                 WHERE cpf=%s
                """,
                (data.nome, data.telefone, data.email, data.endereco_id, cpf),
            )

            cur.execute(
                """
                UPDATE veterinario
                   SET especialidade=%s, clinica=%s
                 WHERE cpf=%s
                """,
                (data.especialidade, data.clinica, cpf),
            )


    return {"status": "veterinário atualizado"}


@router.delete("/{cpf}")
def remover_veterinario(cpf: str):
    sql = "DELETE FROM pessoa WHERE cpf=%s RETURNING cpf"

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (cpf,))
            apagado = cur.fetchone()
            if not apagado:
                raise HTTPException(status_code=404, detail="Veterinário não encontrado.")

    return {"status": "veterinário removido", "cpf": cpf}
