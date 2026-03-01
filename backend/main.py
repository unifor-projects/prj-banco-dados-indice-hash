from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import upload
from api.routes import pages
from api.routes import index

app = FastAPI(title="Simulador Índice Hash Estático")

# CORS
# Ajuste as origens conforme a URL/porta do seu frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(pages.router)
app.include_router(index.router)
