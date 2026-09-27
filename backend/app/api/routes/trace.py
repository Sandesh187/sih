import uuid
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException
from redis.asyncio import Redis

from app.api.deps import get_redis
from app.blockchain.models import TraceRequest, TraceResult
from app.services.trace_jobs import TraceJob, enqueue_trace, load_trace_state

router = APIRouter()


@router.post("/", response_model=Dict[str, str])
async def submit_trace(request: TraceRequest, redis: Redis = Depends(get_redis)):
    trace_id = str(uuid.uuid4())
    job = TraceJob(
        trace_id=trace_id,
        address=request.address,
        chain=request.chain,
        max_depth=request.max_depth,
    )
    await enqueue_trace(redis, job)
    return {"trace_id": trace_id, "status": "queued"}


@router.get("/recent")
async def get_recent_traces(redis: Redis = Depends(get_redis)):
    import json
    # Use SCAN to find active traces
    cursor = b"0"
    keys = []
    while cursor:
        cursor, k = await redis.scan(cursor=cursor, match="vasp:trace:state:*", count=50)
        keys.extend(k)
        if cursor == 0 or cursor == b"0" or str(cursor) == "0":
            break
            
    recent_traces = []
    if keys:
        raw_states = await redis.mget(keys)
        for key, raw in zip(keys, raw_states):
            if not raw:
                continue
            state = json.loads(raw)
            if state.get("status") == "completed" and "result" in state:
                result = state["result"]
                trace_id = result.get("trace_id", key.decode("utf-8").replace("vasp:trace:state:", "") if isinstance(key, bytes) else key.replace("vasp:trace:state:", ""))
                target = result.get("suspect_address", "Unknown")
                chain = result.get("chain", "ETH")
                confidence = result.get("confidence_score", 0)
                risk_score = result.get("risk_score", 0)
                
                # Format risk level
                if risk_score >= 80: risk = "Critical"
                elif risk_score >= 60: risk = "High"
                elif risk_score >= 40: risk = "Medium"
                else: risk = "Low"
                
                vasp = result.get("vasp")
                vasp_name = vasp.get("vasp_name", "Unknown") if vasp else "Unknown"
                
                # Sum total volume from path
                amount_val = sum([tx.get("value", 0) for tx in result.get("path", [])])
                amount = f"${amount_val:,.2f}" if amount_val > 0 else "N/A"
                
                recent_traces.append({
                    "id": trace_id,
                    "target": target,
                    "chain": chain,
                    "vasp": vasp_name,
                    "risk": risk,
                    "confidence": int(confidence * 100),
                    "amount": amount,
                    "time": "Recent"
                })
                
    # Return at most 10 recent traces
    return {"traces": recent_traces[:10]}


@router.get("/{trace_id}")
async def get_trace_result(trace_id: str, redis: Redis = Depends(get_redis)):
    data = await load_trace_state(redis, trace_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Trace ID not found or its result has expired")

    status = data.get("status")
    if status == "failed":
        raise HTTPException(status_code=500, detail=data.get("error", "Trace failed"))
    if status in {"queued", "processing"}:
        return {"status": "processing"}
    if status == "completed":
        return TraceResult.model_validate(data["result"])

    raise HTTPException(status_code=500, detail="Trace job has an invalid stored state")
