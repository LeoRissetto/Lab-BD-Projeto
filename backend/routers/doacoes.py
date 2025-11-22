from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import fetch_all, get_conn

router = APIRouter(prefix="/doacoes", tags=["Doações"])


class DoacaoDTO(BaseModel):
    pessoa_cpf: str
    valor: float
    data: str
    forma_pagamento: Optional[str] = None


class AtualizarDoacaoDTO(BaseModel):
    pessoa_cpf: Optional[str]
    valor: Optional[float]
    data: Optional[str]
    forma_pagamento: Optional[str]


# --------------------------
# LISTAR DOAÇÕES
# --------------------------
@router.get("/")
def listar_doacoes():
    sql = """
        SELECT d.id,
               d.pessoa_cpf,
               d.valor,
               d.data,
               d.forma_pagamento,
               p.nome AS nome
          FROM doacao d
          JOIN pessoa p ON p.cpf = d.pessoa_cpf
      ORDER BY d.data DESC;
    """
    return fetch_all(sql)


@router.get("/doadores")
def listar_doadores():
    sql = """
        SELECT cpf,
               nome
          FROM pessoa
      ORDER BY nome;
    """
    return fetch_all(sql)


# --------------------------
# CRIAR DOAÇÃO
# --------------------------
@router.post("/")
def criar_doacao(d: DoacaoDTO):
    sql = """
        INSERT INTO doacao (pessoa_cpf, valor, data, forma_pagamento)
        VALUES (%s, %s, %s, %s)
        RETURNING *;
    """
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (d.pessoa_cpf, d.valor, d.data, d.forma_pagamento))
            novo = cur.fetchone()
            cols = [c[0] for c in cur.description]
            return dict(zip(cols, novo))


# --------------------------
# ATUALIZAR DOAÇÃO
# --------------------------
@router.put("/{id}")
def atualizar_doacao(id: int, d: AtualizarDoacaoDTO):
    sql = """
        UPDATE doacao
           SET pessoa_cpf=%s,
               valor=%s,
               data=%s,
               forma_pagamento=%s
         WHERE id=%s
     RETURNING *;
    """
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                sql,
                (d.pessoa_cpf, d.valor, d.data, d.forma_pagamento, id)
            )
            atualizado = cur.fetchone()
            if not atualizado:
                raise HTTPException(status_code=404, detail="Doação não encontrada.")
            cols = [c[0] for c in cur.description]
            return dict(zip(cols, atualizado))


# --------------------------
# DELETAR DOAÇÃO
# --------------------------
@router.delete("/{id}")
def remover_doacao(id: int):
    sql = "DELETE FROM doacao WHERE id=%s RETURNING id"
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (id,))
            apagado = cur.fetchone()
            if not apagado:
                raise HTTPException(status_code=404, detail="Doação não encontrada.")
            return {"status": "doação removida", "id": id}


# --------------------------
# RELATÓRIO - RANKING DE DOADORES
# --------------------------
@router.get("/ranking")
def ranking_doadores():
    sql = """
        SELECT p.nome,
               COUNT(*) AS qtd_doacoes,
               SUM(d.valor) AS total_doado,
               RANK() OVER (ORDER BY SUM(d.valor) DESC) AS ranking
          FROM doacao d
          JOIN pessoa p ON p.cpf = d.pessoa_cpf
      GROUP BY p.nome
      ORDER BY total_doado DESC;
    """
    return fetch_all(sql)


# --------------------------
# RELATÓRIO - MÉDIA MÓVEL 3 MESES
# --------------------------
@router.get("/media-movel")
def media_movel():
    sql = """
        WITH totals AS (
            SELECT date_trunc('month', data) AS mes,
                   SUM(valor) AS total_mes
              FROM doacao
          GROUP BY date_trunc('month', data)
        )
        SELECT mes,
               total_mes,
               AVG(total_mes) OVER (
                   ORDER BY mes
                   ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
               ) AS media_movel_3m
          FROM totals
      ORDER BY mes;
    """
    return fetch_all(sql)
