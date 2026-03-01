from fastapi import APIRouter, HTTPException
from domain.services.hash_service import HashService

router = APIRouter(prefix="/index", tags=["Hash Index"])


@router.post("/create-buckets")
def create_buckets():
    try:
        result = HashService.create_buckets()
        return {"message": "Buckets criados com sucesso", **result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/hash/{key}")
def test_hash(key: str):
    try:
        bucket_number = HashService.hash_function(key)
        return {"key": key, "bucket": bucket_number}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/build")
def build_index():
    try:
        result = HashService.build_index()
        return {"message": "Índice construído com sucesso", **result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search/{key}")
def search_key(key: str):
    try:
        result = HashService.search_key(key)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/table-scan/{key}")
def table_scan(key: str):
    try:
        result = HashService.table_scan(key)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/compare/{key}")
def compare_search(key: str):
    try:
        return HashService.compare_search(key)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
