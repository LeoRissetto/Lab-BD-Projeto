from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from database import fetch_all, get_conn

router = APIRouter(prefix="/gatos", tags=["Gatos"])


# -----------------------------
#  MODEL
# -----------------------------
class GatoDTO(BaseModel):
    nome: Optional[str]
    idade: Optional[int]
    data_resgate: Optional[str]  # formato YYYY-MM-DD
    endereco_resgate_id: Optional[int]
    cor: Optional[str]
    raca: Optional[str]
    condicao_saude: Optional[str]


# -----------------------------
#  CRUD
# -----------------------------

@router.get("/")
def listar_gatos(role: str = "public"):
    if role == "admin":
        sql = "SELECT * FROM gatos_admin_view ORDER BY id"
    elif role == "voluntario":
        sql = "SELECT * FROM gatos_voluntarios_view ORDER BY id"
    else:  # usuário comum
        sql = "SELECT * FROM gatos_publicos_view ORDER BY id"

    return fetch_all(sql)

@router.get("/admin")
def listar_admin():
    return fetch_all("SELECT * FROM gatos_admin_view ORDER BY id")

@router.get("/voluntario")
def listar_voluntario():
    return fetch_all("SELECT * FROM gatos_voluntarios_view ORDER BY id")

@router.get("/public")
def listar_publico():
    return fetch_all("SELECT * FROM gatos_publicos_view ORDER BY id")


@router.get("/enderecos")
def listar_enderecos():
    sql = """
        SELECT id,
               CASE
                 WHEN cidade IS NOT NULL AND estado IS NOT NULL THEN cidade || ' - ' || estado
                 WHEN cidade IS NOT NULL THEN cidade
                 WHEN estado IS NOT NULL THEN estado
                 ELSE 'Endereço #' || id
               END AS descricao
          FROM endereco
      ORDER BY cidade, id;
    """
    return fetch_all(sql)


@router.get("/{id}")
def obter_gato(id: int):
    sql = "SELECT * FROM gato WHERE id=%s"
    rows = fetch_all(sql, (id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Gato não encontrado.")
    return rows[0]


@router.post("/")
def criar_gato(data: GatoDTO):
    sql = """
        INSERT INTO gato (nome, idade, data_resgate, endereco_resgate_id, cor, raca, condicao_saude)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING *;
    """

    values = (
        data.nome,
        data.idade,
        data.data_resgate,
        data.endereco_resgate_id,
        data.cor,
        data.raca,
        data.condicao_saude,
    )

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, values)
            novo = cur.fetchone()
            columns = [desc[0] for desc in cur.description]
            return dict(zip(columns, novo))


@router.put("/{id}")
def atualizar_gato(id: int, data: GatoDTO):
    sql = """
        UPDATE gato
           SET nome = %s,
               idade = %s,
               data_resgate = %s,
               endereco_resgate_id = %s,
               cor = %s,
               raca = %s,
               condicao_saude = %s
         WHERE id=%s
     RETURNING *;
    """

    values = (
        data.nome,
        data.idade,
        data.data_resgate,
        data.endereco_resgate_id,
        data.cor,
        data.raca,
        data.condicao_saude,
        id,
    )

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, values)
            updated = cur.fetchone()
            if not updated:
                raise HTTPException(status_code=404, detail="Gato não encontrado.")

            columns = [desc[0] for desc in cur.description]
            return dict(zip(columns, updated))


@router.delete("/{id}")
def deletar_gato(id: int):
    sql = "DELETE FROM gato WHERE id=%s RETURNING id"
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (id,))
            deleted = cur.fetchone()
            if not deleted:
                raise HTTPException(status_code=404, detail="Gato não encontrado.")
            return {"status": "gato removido", "id": id}
