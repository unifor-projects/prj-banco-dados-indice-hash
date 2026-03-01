from pydantic import BaseModel, Field


class PageConfigRequest(BaseModel):
    page_size: int = Field(..., gt=0, description="Quantidade de registros por página")
