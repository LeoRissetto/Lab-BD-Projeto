from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException

try:
    from .supabase_client import get_supabase_client
except ImportError:
    from supabase_client import get_supabase_client  # type: ignore

try:
    from .database import fetch_all
except ImportError:
    from database import fetch_all  # type: ignore

app = FastAPI()

QueryDefinition = Dict[str, Any]


QUERIES: Dict[str, QueryDefinition] = {
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
        "description": "Junções múltiplas com subconsulta correlacionada para buscar a última triagem do adotante.",
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
    "doacoes_rollup": {
        "title": "Arrecadação por mês e campanha (ROLLUP)",
        "description": "Uso de agregação com ROLLUP para somatórios por mês e por campanha.",
        "topics": ["GROUP BY", "ROLLUP", "AGREGAÇÃO"],
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
""",
    },
    "gastos_cube": {
        "title": "Gastos por estado do lar e tipo (CUBE)",
        "description": "Análise multidimensional com CUBE envolvendo lar temporário e tipos de gasto.",
        "topics": ["GROUP BY", "CUBE", "AGREGAÇÃO"],
        "sql": """
SELECT COALESCE(e.estado, 'TODOS OS ESTADOS') AS estado,
       COALESCE(g.tipo, 'TODOS OS TIPOS') AS tipo,
       SUM(g.valor) AS total_gasto
  FROM gasto g
  LEFT JOIN lar_temporario lt ON lt.id = g.lar_id
  LEFT JOIN endereco e ON e.id = lt.endereco_id
 GROUP BY CUBE (e.estado, g.tipo)
 ORDER BY estado, tipo;
""",
    },
    "ranking_gatos": {
        "title": "Ranking de gatos para adoção",
        "description": "Funções analíticas (window functions) para rankear gatos não adotados por idade.",
        "topics": ["WINDOW FUNCTION", "RANK"],
        "sql": """
SELECT g.id,
       g.nome,
       g.idade,
       RANK() OVER (ORDER BY g.idade DESC NULLS LAST) AS ranking_por_idade,
       DENSE_RANK() OVER (ORDER BY g.data_resgate ASC NULLS LAST) AS prioridade_resgate
  FROM gato g
 WHERE g.adotado = FALSE;
""",
    },
    "media_movel_doacoes": {
        "title": "Média móvel de doações",
        "description": "Processamento analítico com CTE e função de janela para média móvel de 3 meses.",
        "topics": ["CTE", "WINDOW FUNCTION", "AVG"],
        "sql": """
WITH totais AS (
    SELECT date_trunc('month', d.data) AS mes,
           SUM(d.valor) AS total_mes
      FROM doacao d
     GROUP BY date_trunc('month', d.data)
)
SELECT mes,
       total_mes,
       AVG(total_mes) OVER (
         ORDER BY mes
         ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ) AS media_movel_3m
  FROM totais
 ORDER BY mes;
""",
    },
    "lista_triggers": {
        "title": "Triggers cadastradas no schema público",
        "description": "Consulta ao catálogo para listar triggers e seus eventos associados.",
        "topics": ["CATÁLOGO", "TRIGGERS"],
        "sql": """
SELECT event_object_table AS tabela,
       trigger_name,
       action_timing AS momento,
       event_manipulation AS evento,
       action_statement
  FROM information_schema.triggers
 WHERE trigger_schema = 'public'
 ORDER BY tabela, trigger_name;
""",
    },
    "visoes_e_materializacoes": {
        "title": "Visões e visões materializadas",
        "description": "Combinação de information_schema e pg_matviews para listar visões disponíveis.",
        "topics": ["VIEWS", "MATERIALIZED VIEWS", "CATÁLOGO"],
        "sql": """
SELECT view_name,
       tipo,
       definicao
  FROM (
        SELECT table_name AS view_name,
               'VIEW' AS tipo,
               view_definition AS definicao
          FROM information_schema.views
         WHERE table_schema = 'public'
        UNION ALL
        SELECT matviewname AS view_name,
               'MATERIALIZED VIEW' AS tipo,
               definition AS definicao
          FROM pg_matviews
         WHERE schemaname = 'public'
       ) v
 ORDER BY view_name;
""",
    },
    "conexoes_ativas": {
        "title": "Atividades e transações em andamento",
        "description": "Monitoramento de sessões abertas para reforçar conceitos de transação e concorrência.",
        "topics": ["CONCORRÊNCIA", "TRANSAÇÕES"],
        "sql": """
SELECT pid,
       usename,
       application_name,
       state,
       wait_event,
       query
  FROM pg_stat_activity
 WHERE datname = current_database()
   AND state IS NOT NULL
 ORDER BY state, pid;
""",
    },
    "lar_ocupacao": {
        "title": "Ocupação dos lares temporários",
        "description": "Taxa de ocupação e vagas disponíveis por lar temporário.",
        "topics": ["JOIN", "GROUP BY", "AGREGAÇÃO"],
        "sql": """
SELECT lt.id AS lar_id,
       e.cidade,
       e.estado,
       lt.capacidade_maxima,
       COUNT(h.gato_id) FILTER (WHERE h.data_saida IS NULL) AS gatos_hospedados,
       GREATEST(
           COALESCE(lt.capacidade_maxima, 0) - COUNT(h.gato_id) FILTER (WHERE h.data_saida IS NULL),
           0
       ) AS vagas_disponiveis,
       CASE
           WHEN lt.capacidade_maxima IS NULL OR lt.capacidade_maxima = 0 THEN NULL
           ELSE ROUND(
               (COUNT(h.gato_id) FILTER (WHERE h.data_saida IS NULL)::numeric / lt.capacidade_maxima) * 100,
               1
           )
       END AS taxa_ocupacao
  FROM lar_temporario lt
  LEFT JOIN endereco e ON e.id = lt.endereco_id
  LEFT JOIN hospedagem h
         ON h.lar_temporario_id = lt.id
        AND h.data_saida IS NULL
 GROUP BY lt.id, e.cidade, e.estado, lt.capacidade_maxima
 ORDER BY gatos_hospedados DESC, lt.id;
""",
    },
    "voluntarios_funcoes": {
        "title": "Distribuição de funções dos voluntários",
        "description": "Quantitativo de voluntários por função cadastrada.",
        "topics": ["GROUP BY", "COUNT"],
        "sql": """
SELECT f.funcao,
       COUNT(DISTINCT f.voluntario_cpf) AS voluntarios
  FROM funcao f
 GROUP BY f.funcao
 ORDER BY voluntarios DESC, f.funcao;
""",
    },
    "eventos_agenda": {
        "title": "Eventos futuros programados",
        "description": "Agenda dos próximos eventos com local e data.",
        "topics": ["FILTER", "JOIN", "ORDER BY"],
        "sql": """
SELECT ev.id,
       ev.nome,
       ev.data_inicio,
       ev.data_fim,
       en.cidade,
       en.estado
  FROM evento ev
  LEFT JOIN endereco en ON en.id = ev.endereco_id
 WHERE ev.data_inicio IS NULL
       OR ev.data_inicio >= CURRENT_DATE
 ORDER BY ev.data_inicio NULLS LAST, ev.nome
 LIMIT 10;
""",
    },
    "procedimentos_veterinarios": {
        "title": "Procedimentos veterinários recentes",
        "description": "Resumo dos procedimentos realizados nos últimos 90 dias por tipo e custo.",
        "topics": ["AGREGAÇÃO", "FILTER", "SUM"],
        "sql": """
SELECT pr.tipo,
       COUNT(*) AS total_procedimentos,
       SUM(COALESCE(pr.custo, 0)) AS custo_total
  FROM procedimento pr
 WHERE pr.data_hora >= CURRENT_TIMESTAMP - INTERVAL '90 days'
 GROUP BY pr.tipo
 ORDER BY total_procedimentos DESC, pr.tipo;
""",
    },
    "triagens_pendentes": {
        "title": "Triagens pendentes ou recentes",
        "description": "Triagens sem resultado definitivo para acompanhamento.",
        "topics": ["JOIN", "FILTER", "ORDER BY"],
        "sql": """
SELECT t.adotante_cpf,
       pa.nome AS adotante,
       t.data,
       t.resultado,
       pr.nome AS responsavel
  FROM triagem t
  JOIN pessoa pa ON pa.cpf = t.adotante_cpf
  LEFT JOIN voluntario v ON v.cpf = t.responsavel_cpf
  LEFT JOIN pessoa pr ON pr.cpf = v.cpf
 WHERE t.resultado IS NULL
    OR t.resultado = 'PENDENTE'
 ORDER BY t.data DESC
 LIMIT 20;
""",
    },
}


@app.get("/")
def read_root():
    return {"status": "ok"}


@app.get("/queries")
def list_queries() -> List[Dict[str, Any]]:
    return [
        {
            "slug": slug,
            "title": definition["title"],
            "description": definition["description"],
            "topics": definition["topics"],
        }
        for slug, definition in QUERIES.items()
    ]


@app.get("/queries/{slug}")
def execute_query(slug: str) -> Dict[str, Any]:
    definition = QUERIES.get(slug)
    if not definition:
        raise HTTPException(status_code=404, detail="Consulta não encontrada.")

    try:
        rows = fetch_all(definition["sql"])
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {
        "slug": slug,
        "title": definition["title"],
        "description": definition["description"],
        "topics": definition["topics"],
        "sql": definition["sql"].strip(),
        "rows": rows,
    }


@app.get("/health/supabase")
def supabase_health_check():
    try:
        client = get_supabase_client()
        response = client.table("gato").select("id").limit(1).execute()
    except Exception as exc:  # pragma: no cover - runtime guard
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {
        "status": "connected",
        "checked_table": "gato",
        "rows_previewed": len(response.data),
    }
