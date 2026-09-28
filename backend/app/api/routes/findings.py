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
    if not findings:
        try:
            from datetime import datetime
            from app.persistence.repository import SQLiteRepository
            sql_findings = await SQLiteRepository.list_findings(case_id=case_id)
            for sf in sql_findings:
                f = Finding(
                    id=sf.id,
                    case_id=sf.case_id,
                    trace_id=sf.trace_id,
                    type=sf.type,
                    severity=sf.severity,
                    title=sf.title,
                    description=sf.description,
                    affected_addresses=sf.affected_addresses or [],
                    evidence_ids=sf.evidence_ids or [],
                    status=sf.status,
                    reviewed_by=sf.reviewed_by,
                    reviewed_at=datetime.fromisoformat(sf.reviewed_at) if sf.reviewed_at and "T" in str(sf.reviewed_at) else None,
                    created_at=datetime.fromisoformat(sf.created_at) if "T" in str(sf.created_at) else datetime.utcnow(),
                )
                findings.append(f)
        except Exception:
            pass

    findings.sort(key=lambda x: x.created_at, reverse=True)
    return findings
