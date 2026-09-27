from fastapi import APIRouter, Depends, HTTPException
from typing import Any, Dict, List
from app.api.deps import get_clustering
from app.core.clustering import AddressClustering
from app.blockchain.models import ClusterInfo

router = APIRouter()

@router.get("/{address}", response_model=ClusterInfo)
async def get_cluster_info(
    address: str,
    clustering: AddressClustering = Depends(get_clustering)
):
    cluster = clustering.get_cluster_info(address)
    if not cluster:
        raise HTTPException(status_code=404, detail="No verified cluster is available for this address")
    return cluster

@router.get("/{address}/members", response_model=List[str])
async def list_cluster_members(
    address: str,
    clustering: AddressClustering = Depends(get_clustering)
):
    cluster = clustering.get_cluster_info(address)
    if not cluster:
        raise HTTPException(status_code=404, detail="No verified cluster is available for this address")
    return cluster.addresses
