from fastapi import APIRouter, UploadFile, File, HTTPException
from domain.services.file_service import FileService

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    try:
        total = await FileService.load_words(file)
        return {"message": "Arquivo carregado com sucesso", "total_palavras": total}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
