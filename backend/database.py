from __future__ import annotations

import os
from contextlib import contextmanager

from dotenv import load_dotenv
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

load_dotenv()

SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")

if not SUPABASE_DB_URL:
    raise RuntimeError(
        "SUPABASE_DB_URL deve estar definido para executar consultas SQL diretas.",
    )

pool = ConnectionPool(conninfo=SUPABASE_DB_URL, kwargs={"autocommit": True}, max_size=5)


@contextmanager
def get_conn():
    with pool.connection() as conn:
        conn.row_factory = dict_row
        yield conn


def fetch_all(query: str, params: dict | tuple | None = None) -> list[dict]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            rows = cur.fetchall()
    return rows
