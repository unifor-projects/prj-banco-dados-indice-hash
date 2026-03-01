from fastapi import APIRouter, HTTPException
from schemas.page_schema import PageConfigRequest
from domain.services.page_service import PageService

router = APIRouter(prefix="/pages", tags=["Pages"])


@router.post("/config")
def configure_page(request: PageConfigRequest):
    try:
        result = PageService.set_page_size(request.page_size)
        return {"message": "Tamanho da página configurado com sucesso", **result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create")
def create_pages():
    try:
        result = PageService.create_pages()
        return {"message": "Páginas criadas com sucesso", **result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
