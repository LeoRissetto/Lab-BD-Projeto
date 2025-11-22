from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from database import fetch_all

router = APIRouter(prefix="/queries", tags=["Relatórios"])

# -------------------------------------------------
#  DICIONÁRIO DE RELATÓRIOS (slug -> metadados + SQL)
# -------------------------------------------------
# Cada entrada aqui vira um relatório no front.
# -------------------------------------------------

QUERIES: Dict[str, Dict[str, Any]] = {
    # 1) DOAÇÕES POR MÊS E CAMPANHA (ROLLUP)
    #    → Usa GROUP BY ROLLUP  (Cube/Rollup/Grouping Sets)
    "doacoes_rollup": {
        "title": "Doações por mês e campanha",
        "description": "Exibe quanto foi doado em cada mês e quanto cada campanha arrecadou.",
        "topics": ["Doações", "Campanhas", "Resumo mensal"],
        "sql": """
    SELECT
        COALESCE(to_char(date_trunc('month', d.data), 'YYYY-MM'), 'TOTAL') AS mes,
        COALESCE(c.nome, 'TODAS AS CAMPANHAS') AS campanha,
        SUM(d.valor) AS total_doado,
        COUNT(*) AS qtd_doacoes
    FROM doacao d
    LEFT JOIN participantes p
        ON p.pessoa_cpf = d.pessoa_cpf
    LEFT JOIN campanha c
        ON c.id = p.campanha_id
    GROUP BY ROLLUP (date_trunc('month', d.data), c.nome)
    ORDER BY mes NULLS LAST, campanha;
            """,
    },

    # 2) RANKING DE DOADORES (WINDOW FUNCTION via função)
    #    → Usa fn_ranking_doadores() que tem RANK() OVER, SUM() OVER
    "ranking_doadores_window": {
        "title": "Ranking de doadores",
        "description": "Lista as pessoas que mais contribuíram com doações e mostra sua representatividade no total arrecadado.",
        "topics": ["Doações", "Ranking"],
        "sql": """
    SELECT
        r.cpf,
        r.nome,
        r.total_doado,
        r.posicao,
        r.percentual
    FROM fn_ranking_doadores() AS r
    ORDER BY r.posicao;
            """,
    },



    # 3) RESUMO DE GASTOS POR LAR E POR TIPO (GROUPING SETS)
    #    → Usa GROUPING SETS para detalhar por lar+tipo, por tipo e total geral.
    "gastos_grouping_sets": {
        "title": "Gastos por lar temporário e categoria",
        "description": "Apresenta quanto cada lar temporário gastou, separado por categorias de despesas.",
        "topics": ["Lares temporários", "Gastos", "Categorias"],
        "sql": """
    WITH base AS (
        SELECT
            lt.id AS lar_id,
            COALESCE(e.cidade, 'SEM CIDADE') AS cidade,
            g.tipo,
            SUM(g.valor) AS gasto_total
        FROM gasto g
        LEFT JOIN lar_temporario lt ON lt.id = g.lar_id
        LEFT JOIN endereco e        ON e.id = lt.endereco_id
        GROUP BY lt.id, e.cidade, g.tipo
    )
    SELECT
        CASE
            WHEN GROUPING(lar_id) = 0 AND GROUPING(tipo) = 0 THEN 'POR_LAR_TIPO'
            WHEN GROUPING(lar_id) = 1 AND GROUPING(tipo) = 0 THEN 'TOTAL_POR_TIPO'
            ELSE 'TOTAL_GERAL'
        END AS nivel,
        lar_id,
        cidade,
        tipo,
        SUM(gasto_total) AS gasto_total
    FROM base
    GROUP BY GROUPING SETS (
        (lar_id, cidade, tipo),  -- detalhe por lar e tipo
        (tipo),                  -- total por tipo
        ()                       -- total geral
    )
    ORDER BY nivel, tipo NULLS LAST, lar_id;
            """,
    },

    # 4) GASTO TOTAL POR GATO USANDO FUNÇÃO PL/PGSQL + CONTROLE
    #    → Usa fn_gasto_total_gato() (FOR LOOP, IF)
    "gasto_total_funcao": {
        "title": "Gasto total por gato",
        "description": "Mostra o gasto total acumulado para cada gato, incluindo cuidados e despesas gerais.",
        "topics": ["Gastos", "Gatos"],
        "sql": """
    SELECT
        g.id   AS gato_id,
        g.nome AS nome,
        fn_gasto_total_gato(g.id) AS gasto_total
    FROM gato g
    ORDER BY gasto_total DESC, g.id;
            """,
    },

    # 5) TOP 10 GATOS COM MAIOR GASTO (usa função com CURSOR)
    "gastos_cursor": {
        "title": "Top 10 gatos com maior gasto",
        "description": "Mostra os 10 gatos que mais geraram gastos no sistema.",
        "topics": ["Gastos", "Gatos"],
        "sql": """
            SELECT
                g.id        AS gato_id,
                g.nome      AS gato_nome,
                r.total_gasto
            FROM fn_resumo_gastos_cursor() AS r
            JOIN gato g ON g.id = r.g_id
            ORDER BY r.total_gasto DESC
            LIMIT 10;
        """,
    },

    # 5b) GATOS DISPONÍVEIS PARA ADOÇÃO (usado na área pública e admin)
    "gatos_disponiveis": {
        "title": "Gatos disponíveis",
        "description": "Mostra todos os gatos sem adoção registrada, incluindo dados da cidade de resgate.",
        "topics": ["Gatos", "Adoções"],
        "sql": """
    SELECT
        g.id,
        g.nome,
        g.idade,
        g.cor,
        g.raca,
        e.cidade AS cidade_resgate,
        e.estado AS estado_resgate
    FROM gato g
    LEFT JOIN endereco e ON e.id = g.endereco_resgate_id
    WHERE NOT EXISTS (
        SELECT 1
          FROM adocao a
         WHERE a.gato_id = g.id
    )
    ORDER BY g.nome;
            """,
    },


    # 6) OCUPAÇÃO DOS LARES TEMPORÁRIOS (bom para gráfico)
    #    → Relatório mais simples, ótimo p/ visualização em gráfico
    "ocupacao_lares": {
        "title": "Ocupação dos lares temporários",
        "description": "Mostra a capacidade, número de gatos hospedados e vagas disponíveis em cada lar.",
        "topics": ["Lares temporários", "Ocupação"],
        "sql": """
    SELECT
        lt.id AS lar_id,
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
    LEFT JOIN hospedagem h
        ON h.lar_temporario_id = lt.id
        AND h.data_saida IS NULL
    GROUP BY lt.id, e.cidade, e.estado, lt.capacidade_maxima
    ORDER BY lt.id;
            """,
    },
}


# -------------------------------------------------
#  ENDPOINT: LISTAR RESUMO DOS RELATÓRIOS
# -------------------------------------------------
@router.get("/")
def listar_relatorios() -> List[Dict[str, Any]]:
    """
    Retorna apenas metadados dos relatórios (sem executar SQL).
    Usado para montar a lista no frontend.
    """
    result: List[Dict[str, Any]] = []
    for slug, data in QUERIES.items():
        result.append(
            {
                "slug": slug,
                "title": data["title"],
                "description": data["description"],
                "topics": data["topics"],
            }
        )
    # ordena alfabeticamente pelo título só para ficar bonito
    result.sort(key=lambda x: x["title"])
    return result


# -------------------------------------------------
#  ENDPOINT: EXECUTAR UM RELATÓRIO ESPECÍFICO
# -------------------------------------------------
@router.get("/{slug}")
def executar_relatorio(slug: str) -> Dict[str, Any]:
    query = QUERIES.get(slug)
    if not query:
        raise HTTPException(status_code=404, detail="Relatório não encontrado.")

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
