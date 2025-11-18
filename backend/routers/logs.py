from fastapi import APIRouter, HTTPException

from database import fetch_all

router = APIRouter(prefix="/logs", tags=["Logs"])


@router.get("/recentes")
def listar_logs_recentes(limit: int = 10):
    if limit <= 0 or limit > 200:
        raise HTTPException(status_code=400, detail="Limite inválido.")

    sql = """
        SELECT l.id,
               l.userid,
               u.login,
               u.tipo,
               l.data_hora
          FROM log_table l
          JOIN users u ON u.userid = l.userid
      ORDER BY l.data_hora DESC
         LIMIT %s
    """

    return fetch_all(sql, (limit,))
