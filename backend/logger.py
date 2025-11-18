from psycopg.connection import Connection


def registrar_log(conn: Connection, userid: int) -> None:
    with conn.cursor() as cur:
        cur.execute("INSERT INTO log_table (userid) VALUES (%s)", (userid,))
