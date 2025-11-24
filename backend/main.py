from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    auth,
    gatos,
    adocoes,
    triagem,
    voluntarios,
    veterinarios,
    lares,
    gastos,
    doacoes,
    eventos,
    relatorios,
    health,
    logs,
    interesses,
)

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar os routers
app.include_router(auth.router)
app.include_router(gatos.router)
app.include_router(adocoes.router)
app.include_router(triagem.router)
app.include_router(voluntarios.router)
app.include_router(veterinarios.router)
app.include_router(lares.router)
app.include_router(gastos.router)
app.include_router(doacoes.router)
app.include_router(eventos.router)
app.include_router(relatorios.router)
app.include_router(health.router)
app.include_router(logs.router)
app.include_router(interesses.router)


@app.get("/")
def root():
    return {"status": "ok"}
