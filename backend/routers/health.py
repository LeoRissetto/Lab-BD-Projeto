from fastapi import APIRouter, HTTPException
from supabase_client import get_supabase_client

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/supabase")
def supabase_check():
    try:
        client = get_supabase_client()
        test = client.table("gato").select("id").limit(1).execute()
        return {"status": "connected", "rows_previewed": len(test.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
