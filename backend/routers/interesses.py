from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field, constr, validator

from database import get_conn

router = APIRouter(prefix="/interesses", tags=["Interesses"])


class InteressePayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    cpf: constr(strip_whitespace=True, min_length=11, max_length=11)
    nome: constr(strip_whitespace=True, min_length=2, max_length=255)
    telefone: Optional[constr(strip_whitespace=True, max_length=15)] = None
    email: Optional[constr(strip_whitespace=True, max_length=255)] = None
    mensagem: Optional[constr(strip_whitespace=True, max_length=500)] = None
    gatoId: Optional[int] = Field(default=None, alias="gatoId")
    foto_urls: List[constr(strip_whitespace=True, max_length=255)] = Field(
        default_factory=list, alias="fotoUrls"
    )

    @validator("cpf")
    def cpf_digits(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 11:
            raise ValueError("CPF deve ter 11 dígitos numéricos")
        return v


def _upsert_pessoa_and_adotante(cur, payload: InteressePayload) -> None:
    cur.execute(
        """
      INSERT INTO pessoa (cpf, nome, telefone, email)
      VALUES (%s, %s, %s, %s)
      ON CONFLICT (cpf) DO UPDATE
        SET nome = EXCLUDED.nome,
            telefone = EXCLUDED.telefone,
            email = EXCLUDED.email;
      """,
        (payload.cpf, payload.nome, payload.telefone, payload.email),
    )

    cur.execute(
        """
      INSERT INTO adotante (cpf, procurando_gato)
      VALUES (%s, TRUE)
      ON CONFLICT (cpf) DO UPDATE
        SET procurando_gato = EXCLUDED.procurando_gato;
      """,
        (payload.cpf,),
    )


def _persist_fotos(cur, payload: InteressePayload) -> int:
    if not payload.foto_urls:
        return 0

    inserted = 0
    for url in payload.foto_urls:
        cur.execute(
            """
        INSERT INTO fotos_triagem (adotante_cpf, foto_url)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING;
        """,
            (payload.cpf, url),
        )
        inserted += cur.rowcount if cur.rowcount else 0
    return inserted


@router.post("/")
def registrar_interesse(payload: InteressePayload):
    with get_conn() as conn:
        with conn.cursor() as cur:
            _upsert_pessoa_and_adotante(cur, payload)
            fotos_inseridas = _persist_fotos(cur, payload)

    return {
        "status": "ok",
        "fotos_inseridas": fotos_inseridas,
    }
