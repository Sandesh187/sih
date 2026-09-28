from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
from contextlib import asynccontextmanager
from redis.asyncio import Redis

from app.config import settings
from app.api.routes import trace, cluster, graph, report

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
    description="Backend API for Fund Tracing, Address Clustering, and Risk Scoring",
    version="1.0.0",
    lifespan=lifespan
)

from fastapi.security import APIKeyHeader
from fastapi import Depends, HTTPException, status

api_key_header = APIKeyHeader(name="X-API-Key")

async def verify_api_key(api_key: str = Depends(api_key_header)):
    if api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API Key"
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

app.include_router(trace.router, prefix="/api/v1/trace", tags=["Trace"], dependencies=protected_dependencies)
app.include_router(cluster.router, prefix="/api/v1/cluster", tags=["Cluster"], dependencies=protected_dependencies)
app.include_router(graph.router, prefix="/api/v1/graph", tags=["Graph"], dependencies=protected_dependencies)
app.include_router(report.router, prefix="/api/v1/report", tags=["Report"], dependencies=protected_dependencies)

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "environment": settings.APP_ENV}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=settings.APP_DEBUG)
