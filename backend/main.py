from fastapi import FastAPI
from api.routes import upload
from api.routes import pages
from api.routes import index

app = FastAPI(title="Simulador Índice Hash Estático")

app.include_router(upload.router)
app.include_router(pages.router)
app.include_router(index.router)
