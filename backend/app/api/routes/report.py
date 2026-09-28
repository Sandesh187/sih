from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from redis.asyncio import Redis
from app.api.deps import get_redis
from app.blockchain.models import InvestigationReport, TraceResult
from app.services.trace_jobs import load_trace_state

router = APIRouter()

@router.get("/{trace_id}", response_model=InvestigationReport)
async def generate_report(trace_id: str, redis: Redis = Depends(get_redis)):
    data = await load_trace_state(redis, trace_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Trace ID not found or its result has expired")

    if data["status"] != "completed":
        raise HTTPException(status_code=400, detail="Trace is not yet completed")
        
    result = TraceResult.model_validate(data["result"])
    
    vasp_name = result.vasp.vasp_name if result.vasp else None
    endpoint = f"terminating at {vasp_name}" if vasp_name else "without a verified VASP attribution"
    
    return InvestigationReport(
        trace_id=trace_id,
        suspect_wallet=result.suspect_address,
        identified_vasp=vasp_name,
        risk_score=result.risk_score,
        traced_path_summary=f"Funds traced over {len(result.path)} hops {endpoint}. The risk score is {result.risk_score:.1f}/100.0, classified by GNN heuristics as {result.gnn_prediction.get('predicted_class', 'unknown') if result.gnn_prediction else 'unknown'}.",
        methodology_notes="Automated Priority BFS with value-sorted edge capping, cross-referenced with Elliptic-compatible node features.",
        generated_at=datetime.utcnow(),
        confidence=result.confidence_score
    )
