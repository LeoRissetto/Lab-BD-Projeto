from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import fetch_all, get_conn

router = APIRouter(prefix="/triagem", tags=["Triagem"])


class TriagemDTO(BaseModel):
    adotante_cpf: str
    data: str  # YYYY-MM-DD
    responsavel_cpf: str
    resultado: str | None = None


@router.get("/")
def listar_triagens():
    sql = """
        SELECT t.adotante_cpf,
               p.nome AS adotante,
               t.data,
               t.resultado,
               r.nome AS responsavel
          FROM triagem t
          JOIN pessoa p ON p.cpf = t.adotante_cpf
          JOIN voluntario v ON v.cpf = t.responsavel_cpf
          JOIN pessoa r ON r.cpf = v.cpf
      ORDER BY t.data DESC;
    """
    return fetch_all(sql)


@router.get("/adotante/{cpf}")
def triagens_por_adotante(cpf: str):
    sql = "SELECT * FROM triagem WHERE adotante_cpf=%s ORDER BY data DESC"
    return fetch_all(sql, (cpf,))


@router.post("/")
def registrar_triagem(data: TriagemDTO):
    sql = """
        INSERT INTO triagem (adotante_cpf, data, responsavel_cpf, resultado)
        VALUES (%s, %s, %s, %s)
        RETURNING *;
    """

    with get_conn() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(sql, (data.adotante_cpf, data.data, data.responsavel_cpf, data.resultado))
                novo = cur.fetchone()
                cols = [c[0] for c in cur.description]
                return dict(zip(cols, novo))
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))
