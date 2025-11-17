from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import fetch_all, get_conn

router = APIRouter(prefix="/eventos", tags=["Eventos"])


class EventoDTO(BaseModel):
    nome: str
    data_inicio: Optional[str]
    data_fim: Optional[str]
    endereco_id: Optional[int]


class AtualizarEventoDTO(BaseModel):
    nome: Optional[str]
    data_inicio: Optional[str]
    data_fim: Optional[str]
    endereco_id: Optional[int]


class ParticipanteDTO(BaseModel):
    evento_id: int
    pessoa_cpf: str


# -----------------------------
# CRUD BÁSICO
# -----------------------------
@router.get("/")
def listar_eventos():
    sql = """
        SELECT ev.id, ev.nome, ev.data_inicio, ev.data_fim,
               e.cidade, e.estado
          FROM evento ev
     LEFT JOIN endereco e ON e.id = ev.endereco_id
      ORDER BY ev.data_inicio;
    """
    return fetch_all(sql)


@router.post("/")
def criar_evento(ev: EventoDTO):
    sql = """
        INSERT INTO evento (nome, data_inicio, data_fim, endereco_id)
        VALUES (%s, %s, %s, %s)
        RETURNING *;
    """

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (ev.nome, ev.data_inicio, ev.data_fim, ev.endereco_id))
            novo = cur.fetchone()
            cols = [c[0] for c in cur.description]
            return dict(zip(cols, novo))


@router.put("/{id}")
def atualizar_evento(id: int, ev: AtualizarEventoDTO):
    sql = """
        UPDATE evento
           SET nome=%s,
               data_inicio=%s,
               data_fim=%s,
               endereco_id=%s
         WHERE id=%s
     RETURNING *;
    """
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (ev.nome, ev.data_inicio, ev.data_fim, ev.endereco_id, id))
            atualizado = cur.fetchone()

            if not atualizado:
                raise HTTPException(status_code=404, detail="Evento não encontrado.")

            cols = [c[0] for c in cur.description]
            return dict(zip(cols, atualizado))


@router.delete("/{id}")
def remover_evento(id: int):
    sql = "DELETE FROM evento WHERE id=%s RETURNING id"

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (id,))
            apagado = cur.fetchone()
            if not apagado:
                raise HTTPException(status_code=404, detail="Evento não encontrado.")
            return {"status": "evento removido", "id": id}


# -----------------------------
# PRÓXIMOS EVENTOS
# -----------------------------
@router.get("/proximos")
def proximos_eventos():
    sql = """
        SELECT ev.id,
               ev.nome,
               ev.data_inicio,
               ev.data_fim,
               e.cidade,
               e.estado
          FROM evento ev
     LEFT JOIN endereco e ON e.id = ev.endereco_id
         WHERE ev.data_inicio >= CURRENT_DATE
      ORDER BY ev.data_inicio
         LIMIT 20;
    """
    return fetch_all(sql)


# -----------------------------
# PARTICIPANTES
# -----------------------------
@router.post("/participantes")
def adicionar_participante(p: ParticipanteDTO):
    sql = """
        INSERT INTO participantes (evento_id, pessoa_cpf)
        VALUES (%s, %s)
        RETURNING *;
    """
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (p.evento_id, p.pessoa_cpf))
            novo = cur.fetchone()
            cols = [c[0] for c in cur.description]
            return dict(zip(cols, novo))


@router.delete("/participantes/{evento_id}/{cpf}")
def remover_participante(evento_id: int, cpf: str):
    sql = """
        DELETE FROM participantes
         WHERE evento_id=%s AND pessoa_cpf=%s
     RETURNING evento_id;
    """
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (evento_id, cpf))
            apagado = cur.fetchone()
            if not apagado:
                raise HTTPException(status_code=404, detail="Participante não encontrado.")
            return {"status": "participante removido"}
