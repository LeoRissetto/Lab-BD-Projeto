from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import fetch_all, get_conn

router = APIRouter(prefix="/lares", tags=["Lares Temporários"])


class LarDTO(BaseModel):
    endereco_id: int
    capacidade_maxima: Optional[int]
    responsavel_cpf: Optional[str]


class AtualizarLarDTO(BaseModel):
    endereco_id: Optional[int]
    capacidade_maxima: Optional[int]
    responsavel_cpf: Optional[str]


@router.get("/")
def listar_lares():
    sql = """
        SELECT lt.id, e.cidade, e.estado, lt.capacidade_maxima, lt.responsavel_cpf
          FROM lar_temporario lt
          JOIN endereco e ON e.id = lt.endereco_id
      ORDER BY lt.id;
    """
    return fetch_all(sql)


@router.get("/ocupacao")
def ocupacao_lares():
    sql = """
        SELECT lt.id AS lar_id,
               e.cidade,
               e.estado,
               lt.capacidade_maxima,
               COUNT(h.gato_id) FILTER (WHERE h.data_saida IS NULL) AS gatos_hospedados,
               GREATEST(
                   COALESCE(lt.capacidade_maxima, 0) -
                   COUNT(h.gato_id) FILTER (WHERE h.data_saida IS NULL),
                   0
               ) AS vagas_disponiveis
          FROM lar_temporario lt
     LEFT JOIN endereco e ON e.id = lt.endereco_id
     LEFT JOIN hospedagem h ON h.lar_temporario_id = lt.id
                             AND h.data_saida IS NULL
      GROUP BY lt.id, e.cidade, e.estado, lt.capacidade_maxima
      ORDER BY lt.id;
    """
    return fetch_all(sql)


@router.post("/")
def criar_lar(data: LarDTO):
    sql = """
        INSERT INTO lar_temporario (endereco_id, capacidade_maxima, responsavel_cpf)
        VALUES (%s, %s, %s)
        RETURNING *;
    """

    with get_conn() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(sql, (data.endereco_id, data.capacidade_maxima, data.responsavel_cpf))
                novo = cur.fetchone()
                cols = [c[0] for c in cur.description]
                return dict(zip(cols, novo))
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))


@router.put("/{id}")
def atualizar_lar(id: int, data: AtualizarLarDTO):
    sql = """
        UPDATE lar_temporario
           SET endereco_id=%s,
               capacidade_maxima=%s,
               responsavel_cpf=%s
         WHERE id=%s
     RETURNING *;
    """

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                sql,
                (data.endereco_id, data.capacidade_maxima, data.responsavel_cpf, id),
            )
            atualizado = cur.fetchone()

            if not atualizado:
                raise HTTPException(status_code=404, detail="Lar não encontrado.")

            cols = [c[0] for c in cur.description]
            return dict(zip(cols, atualizado))


@router.delete("/{id}")
def remover_lar(id: int):
    sql = "DELETE FROM lar_temporario WHERE id=%s RETURNING id"

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (id,))
            apagado = cur.fetchone()
            if not apagado:
                raise HTTPException(status_code=404, detail="Lar não encontrado.")

            return {"status": "lar removido", "id": id}
