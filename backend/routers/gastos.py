from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import fetch_all, get_conn

router = APIRouter(prefix="/gastos", tags=["Gastos"])


# -------------------------------
# MODEL
# -------------------------------
class GastoDTO(BaseModel):
    lar_id: int
    tipo: str
    valor: float
    data: str  # YYYY-MM-DD
    descricao: Optional[str] = None


class AtualizarGastoDTO(BaseModel):
    lar_id: Optional[int]
    tipo: Optional[str]
    valor: Optional[float]
    data: Optional[str]
    descricao: Optional[str]


# -------------------------------
# ROTA: LISTAR
# -------------------------------
@router.get("/")
def listar_gastos():
    sql = """
        SELECT g.id,
               g.tipo,
               g.valor,
               g.data,
               g.descricao,
               lt.id AS lar_id,
               e.cidade,
               e.estado
          FROM gasto g
          LEFT JOIN lar_temporario lt ON lt.id = g.lar_id
          LEFT JOIN endereco e ON e.id = lt.endereco_id
      ORDER BY g.data DESC;
    """
    return fetch_all(sql)


# -------------------------------
# ROTA: CRIAR
# -------------------------------
@router.post("/")
def criar_gasto(g: GastoDTO):
    sql = """
        INSERT INTO gasto (lar_id, tipo, valor, data, descricao)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING *;
    """
    with get_conn() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(sql, (g.lar_id, g.tipo, g.valor, g.data, g.descricao))
                novo = cur.fetchone()
                cols = [c[0] for c in cur.description]
                return dict(zip(cols, novo))
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))


# -------------------------------
# ROTA: ATUALIZAR
# -------------------------------
@router.put("/{id}")
def atualizar_gasto(id: int, g: AtualizarGastoDTO):
    sql = """
        UPDATE gasto
           SET lar_id=%s,
               tipo=%s,
               valor=%s,
               data=%s,
               descricao=%s
         WHERE id=%s
     RETURNING *;
    """

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (
                g.lar_id, g.tipo, g.valor, g.data, g.descricao, id
            ))
            atualizado = cur.fetchone()

            if not atualizado:
                raise HTTPException(status_code=404, detail="Gasto não encontrado.")

            cols = [c[0] for c in cur.description]
            return dict(zip(cols, atualizado))


# -------------------------------
# ROTA: DELETAR
# -------------------------------
@router.delete("/{id}")
def remover_gasto(id: int):
    sql = "DELETE FROM gasto WHERE id=%s RETURNING id"

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (id,))
            apagado = cur.fetchone()
            if not apagado:
                raise HTTPException(status_code=404, detail="Gasto não encontrado.")
            return {"status": "gasto removido", "id": id}


# -------------------------------
# RELATÓRIO 1: GASTOS POR LAR
# -------------------------------
@router.get("/por-lar")
def gastos_por_lar():
    sql = """
        SELECT lt.id AS lar_id,
               e.cidade,
               e.estado,
               SUM(g.valor) AS total_gastos
          FROM gasto g
          JOIN lar_temporario lt ON lt.id = g.lar_id
          LEFT JOIN endereco e ON e.id = lt.endereco_id
      GROUP BY lt.id, e.cidade, e.estado
      ORDER BY total_gastos DESC;
    """
    return fetch_all(sql)


# -------------------------------
# RELATÓRIO 2: GASTOS POR TIPO
# -------------------------------
@router.get("/por-tipo")
def gastos_por_tipo():
    sql = """
        SELECT tipo, SUM(valor) AS total
          FROM gasto
      GROUP BY tipo
      ORDER BY total DESC;
    """
    return fetch_all(sql)
