import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from redis.asyncio import Redis

from app.api.deps import get_redis
from app.blockchain.models import Finding
from app.core.redis_keys import KEY_FINDINGS_PREFIX

router = APIRouter()

@router.get("", response_model=List[Finding])
async def get_findings(
    case_id: Optional[str] = None,
    redis: Redis = Depends(get_redis)
):
    # Use SCAN to find active findings
    cursor = b"0"
    keys = []
    match_pattern = f"{KEY_FINDINGS_PREFIX}{case_id}:*" if case_id else f"{KEY_FINDINGS_PREFIX}*"
    
    while cursor:
        cursor, k = await redis.scan(cursor=cursor, match=match_pattern, count=50)
        keys.extend(k)
        if cursor == 0 or cursor == b"0" or str(cursor) == "0":
            break
            
    findings = []
    if keys:
        raw_states = await redis.mget(keys)
        for raw in raw_states:
            if raw:
                try:
                    finding_data = json.loads(raw)
                    findings.append(Finding.model_validate(finding_data))
                except Exception:
                    pass
                    
    # Sort by created_at descending
    findings.sort(key=lambda x: x.created_at, reverse=True)
    return findings
