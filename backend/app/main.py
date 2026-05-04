from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.database import engine, SessionLocal
from app.models.models import Base
from app.api.v1 import auth, banks, applications, analytics, integration_mapper, rate_grids


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Seed
    from app.seed import seed
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Maruti Admin Portal — API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router,               prefix="/api/v1")
app.include_router(banks.router,              prefix="/api/v1")
app.include_router(applications.router,       prefix="/api/v1")
app.include_router(analytics.router,          prefix="/api/v1")
app.include_router(integration_mapper.router, prefix="/api/v1")
app.include_router(rate_grids.router,        prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "healthy", "service": "maruti-admin-backend", "version": "1.0.0"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    print(f"[ERROR] {request.url.path}: {exc}")
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": str(exc)})
