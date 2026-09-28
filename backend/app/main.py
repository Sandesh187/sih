from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
import httpx
from contextlib import asynccontextmanager
from redis.asyncio import Redis

from app.config import settings
from app.api.routes import trace, cluster, graph, report, cases, evidence, demo, findings

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=30.0)
    app.state.redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        await app.state.redis.ping()
        yield
    finally:
        await app.state.http_client.aclose()
        await app.state.redis.aclose()

app = FastAPI(
    title="SIH26182 Crypto VASP Attribution Engine API",
    description="Enterprise Forensic Platform for Fund Tracing, VASP Attribution, Case Management & BSA/BNSS Compliance",
    version="2.0.0",
    lifespan=lifespan
)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Depends(api_key_header)):
    # Support development and demo walkthroughs gracefully
    if not api_key or api_key != settings.API_KEY:
        # If in development or testing mode, allow default dev key
        if settings.APP_ENV != "production" and (not api_key or api_key == "dev_secret_key_123"):
            return "dev_secret_key_123"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing X-API-Key"
        )
    return api_key

origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",")]
if "*" in origins:
    allow_credentials = False
else:
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Protect investigation endpoints with the API key dependency
protected_dependencies = [Depends(verify_api_key)]

# Core Tracing, Graph, and Cluster routes
app.include_router(trace.router, prefix="/api/v1/trace", tags=["Trace"], dependencies=protected_dependencies)
app.include_router(cluster.router, prefix="/api/v1/cluster", tags=["Cluster"], dependencies=protected_dependencies)
app.include_router(graph.router, prefix="/api/v1/graph", tags=["Graph"], dependencies=protected_dependencies)
app.include_router(report.router, prefix="/api/v1/report", tags=["Report"], dependencies=protected_dependencies)

# New Enterprise Case Management, Evidence Vault, and Evaluation Demo routes
app.include_router(cases.router, prefix="/api/v1", tags=["Cases"], dependencies=protected_dependencies)
app.include_router(evidence.router, prefix="/api/v1", tags=["Evidence"], dependencies=protected_dependencies)
app.include_router(demo.router, prefix="/api/v1", tags=["Demo"], dependencies=protected_dependencies)
app.include_router(findings.router, prefix="/api/v1/findings", tags=["Findings"], dependencies=protected_dependencies)

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "environment": settings.APP_ENV, "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=settings.APP_DEBUG)
