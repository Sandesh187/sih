import httpx
from fastapi import Request
from redis.asyncio import Redis
from app.config import settings, Settings
from app.blockchain.ethereum import EthereumClient
from app.blockchain.tron import TronClient
from app.core.tracer import FundTracer
from app.core.clustering import AddressClustering
from app.core.community import CommunityDetector
from app.utils.risk_score import RiskScorer

def get_settings() -> Settings:
    return settings

def get_redis(request: Request) -> Redis:
    return request.app.state.redis

def get_eth_client(request: Request) -> EthereumClient:
    return EthereumClient(request.app.state.http_client)

def get_tron_client(request: Request) -> TronClient:
    return TronClient(request.app.state.http_client)

def get_tracer(request: Request) -> FundTracer:
    return FundTracer(
        eth_client=get_eth_client(request),
        tron_client=get_tron_client(request)
    )

def get_clustering() -> AddressClustering:
    return AddressClustering()

def get_community_detector() -> CommunityDetector:
    return CommunityDetector()

def get_risk_scorer() -> RiskScorer:
    return RiskScorer()
