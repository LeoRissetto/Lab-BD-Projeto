from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import fetch_all, get_conn

router = APIRouter(prefix="/adocoes", tags=["Adoções"])


# ---------------------------------
# DATA MODELS
# ---------------------------------
class RegistrarAdocaoDTO(BaseModel):
    gato_id: int
    adotante_cpf: str
    data: str
    motivo: str | None = None


# ---------------------------------
# ROTAS
# ---------------------------------

@router.get("/")
def listar_adocoes():
    sql = """
        SELECT a.gato_id, g.nome AS gato,
               a.adotante_cpf, p.nome AS adotante,
               a.data, a.motivo
          FROM adocao a
          JOIN gato g ON g.id = a.gato_id
          JOIN pessoa p ON p.cpf = a.adotante_cpf
      ORDER BY a.data DESC;
    """
    return fetch_all(sql)


@router.get("/gato/{id}")
def adocoes_por_gato(id: int):
    sql = "SELECT * FROM adocao WHERE gato_id=%s ORDER BY data DESC"
    return fetch_all(sql, (id,))


@router.get("/adotante/{cpf}")
def adocoes_por_adotante(cpf: str):
    sql = "SELECT * FROM adocao WHERE adotante_cpf=%s ORDER BY data DESC"
    return fetch_all(sql, (cpf,))


@router.post("/registrar")
def registrar_adocao(data: RegistrarAdocaoDTO):
    """
    Chama a stored procedure registrar_adocao()
    Você deve garantir que a procedure existe no banco.
    """

    with get_conn() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(
                    "CALL registrar_adocao(%s, %s, %s, %s)",
                    (data.gato_id, data.adotante_cpf, data.data, data.motivo),
                )
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

    return {"status": "adoção registrada com sucesso"}
