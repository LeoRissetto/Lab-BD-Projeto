from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from database import fetch_all

router = APIRouter(prefix="/queries", tags=["Relatórios"])

# -----------------------------------------------
#  TODO: TODAS AS QUERIES DO SEU ANTIGO main.py
# -----------------------------------------------
QUERIES: Dict[str, Dict[str, Any]] = {
    "gatos_disponiveis": {
        "title": "Gatos disponíveis para adoção",
        "description": "Consulta básica com junção opcional para exibir o endereço de resgate.",
        "topics": ["SELECT", "JOIN", "ORDER BY"],
        "sql": """
SELECT g.id,
       g.nome,
       g.idade,
       g.cor,
       g.raca,
       e.cidade AS cidade_resgate,
       e.estado AS estado_resgate
  FROM gato g
  LEFT JOIN endereco e ON e.id = g.endereco_resgate_id
 WHERE g.adotado = FALSE
 ORDER BY g.nome;
""",
    },
    "adocoes_detalhadas": {
        "title": "Histórico detalhado de adoções",
        "description": "Junções múltiplas com subconsulta correlrelacionada.",
        "topics": ["JOIN", "SUBQUERY", "ORDER BY"],
        "sql": """
SELECT a.data,
       g.nome AS gato,
       p.nome AS adotante,
       e.cidade AS cidade_adotante,
       e.estado AS estado_adotante,
       t.resultado AS resultado_triagem
  FROM adocao a
  JOIN gato g ON g.id = a.gato_id
  JOIN adotante ad ON ad.cpf = a.adotante_cpf
  JOIN pessoa p ON p.cpf = ad.cpf
  LEFT JOIN LATERAL (
        SELECT t1.resultado
          FROM triagem t1
         WHERE t1.adotante_cpf = ad.cpf
         ORDER BY t1.data DESC
         LIMIT 1
       ) t ON TRUE
  LEFT JOIN endereco e ON e.id = p.endereco_id
 ORDER BY a.data DESC
 LIMIT 50;
""",
    },

    # ---------------------------
    # SUA LISTA COMPLETA DE QUERIES
    # (igual ao main.py original)
    # ---------------------------
    "doacoes_rollup": {
        "title": "Arrecadação por mês e campanha (ROLLUP)",
        "description": "Uso de agregação com ROLLUP.",
        "topics": ["GROUP BY", "ROLLUP"],
        "sql": """
SELECT COALESCE(to_char(date_trunc('month', d.data), 'YYYY-MM'), 'TOTAL') AS mes,
       COALESCE(c.nome, 'TODAS AS CAMPANHAS') AS campanha,
       SUM(d.valor) AS total_doado,
       COUNT(*) AS quantidade_doacoes
  FROM doacao d
  LEFT JOIN participantes p ON p.pessoa_cpf = d.pessoa_cpf
  LEFT JOIN campanha c ON c.id = p.campanha_id
 GROUP BY ROLLUP (date_trunc('month', d.data), c.nome)
 ORDER BY mes NULLS LAST, campanha;
"""
    },

    # ...  (INCLUA AQUI TODAS AS OUTRAS QUERIES QUE ESTÃO NO SEU main.py)
}


# -----------------------------------------------
#  ROTAS
# -----------------------------------------------
@router.get("/")
def list_queries() -> List[Dict[str, Any]]:
    return [
        {
            "slug": slug,
            "title": q["title"],
            "description": q["description"],
            "topics": q["topics"],
        }
        for slug, q in QUERIES.items()
    ]


@router.get("/{slug}")
def execute_query(slug: str):
    query = QUERIES.get(slug)
    if not query:
        raise HTTPException(status_code=404, detail="Consulta não encontrada.")

    try:
        rows = fetch_all(query["sql"])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {
        "slug": slug,
        "title": query["title"],
        "description": query["description"],
        "topics": query["topics"],
        "sql": query["sql"],
        "rows": rows,
    }
