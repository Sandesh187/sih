from fastapi import APIRouter, Depends, Query
from app.api.deps import get_tracer
from app.core.tracer import FundTracer

router = APIRouter()

@router.get("/{address}")
async def get_subgraph(
    address: str,
    chain: str = Query("eth", description="Blockchain network (eth or tron)"),
    depth: int = Query(1, ge=1, le=15, description="Maximum number of transfer hops to traverse"),
    limit: int = Query(50, ge=1, le=200, description="Maximum edges to return"),
    tracer: FundTracer = Depends(get_tracer),
):
    graph = await tracer.build_trace_graph(address, chain, depth)
    nodes = {address.lower()}
    edges = []
    for from_addr, to_addr, data in list(graph.edges(data=True))[:limit]:
        nodes.add(from_addr)
        nodes.add(to_addr)
        edges.append({
            "data": {
                "source": from_addr,
                "target": to_addr,
                "weight": data["weight"],
                "asset": data.get("asset", "ETH" if chain.lower() in ["eth", "ethereum"] else "TRX"),
            }
        })
            
    cytoscape_nodes = [{"data": {"id": n, "label": n[:8]}} for n in nodes]
    
    return {
        "nodes": cytoscape_nodes,
        "edges": edges
    }
