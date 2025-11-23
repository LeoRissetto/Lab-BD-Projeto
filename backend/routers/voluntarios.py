from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from database import fetch_all

router = APIRouter(prefix="/voluntarios", tags=["Voluntários"])


# ---------------------------------------
# MODELOS
# ---------------------------------------
class PessoaDTO(BaseModel):
    cpf: str
    nome: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    endereco_id: Optional[int] = None


class VoluntarioDTO(BaseModel):
    cpf: str
    funcoes: Optional[List[str]] = []


class AtualizarVoluntarioDTO(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    endereco_id: Optional[int] = None
    funcoes: Optional[List[str]] = []


# ---------------------------------------
# ROTAS
# ---------------------------------------

@router.get("/")
def listar_voluntarios(role: str = "PUBLIC"):
    role_upper = role.upper()
    if role_upper == "VOLUNTARIO":
        return []

    sql = """
        SELECT v.cpf,
               p.nome,
               p.telefone,
               p.email,
               p.endereco_id,
               COALESCE(array_remove(array_agg(f.funcao), NULL), ARRAY[]::text[]) AS funcoes
          FROM voluntario v
          JOIN pessoa p ON p.cpf = v.cpf
          LEFT JOIN funcao f ON f.voluntario_cpf = v.cpf
      GROUP BY v.cpf, p.nome, p.telefone, p.email, p.endereco_id
      ORDER BY p.nome;
    """
    return fetch_all(sql)


@router.post("/")
def criar_voluntario(pessoa: PessoaDTO, dados: VoluntarioDTO):
    with get_conn() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(
                    "INSERT INTO pessoa (cpf, nome, telefone, email, endereco_id) VALUES (%s, %s, %s, %s, %s)",
                    (pessoa.cpf, pessoa.nome, pessoa.telefone, pessoa.email, pessoa.endereco_id),
                )
                cur.execute(
                    "INSERT INTO voluntario (cpf) VALUES (%s)",
                    (dados.cpf,),
                )

                for func in dados.funcoes:
                    cur.execute(
                        "INSERT INTO funcao (voluntario_cpf, funcao) VALUES (%s, %s)",
                        (dados.cpf, func),
                    )
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

    return {"status": "voluntário criado com sucesso", "cpf": dados.cpf}


@router.put("/{cpf}")
def atualizar_voluntario(cpf: str, data: AtualizarVoluntarioDTO):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE pessoa
                   SET nome=%s,
                       telefone=%s,
                       email=%s,
                       endereco_id=%s
                 WHERE cpf=%s
                """,
                (data.nome, data.telefone, data.email, data.endereco_id, cpf),
            )

            cur.execute("DELETE FROM funcao WHERE voluntario_cpf=%s", (cpf,))
            for f in data.funcoes:
                cur.execute(
                    "INSERT INTO funcao (voluntario_cpf, funcao) VALUES (%s, %s)",
                    (cpf, f),
                )


    return {"status": "voluntário atualizado"}


@router.delete("/{cpf}")
def remover_voluntario(cpf: str):
    sql = "DELETE FROM pessoa WHERE cpf=%s RETURNING cpf"

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (cpf,))
            apagado = cur.fetchone()
            if not apagado:
                raise HTTPException(status_code=404, detail="Voluntário não encontrado.")
    return {"status": "voluntário removido", "cpf": cpf}
