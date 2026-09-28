"""
Immutable Forensic Audit Trail & Chain of Custody Logger.
Manages append-only event logging in Redis to satisfy Section 63(4) BSA compliance.
"""

import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from redis.asyncio import Redis

from app.blockchain.models import AuditEvent, AuditEventType
from app.core.redis_keys import (
    audit_event_key,
    audit_timeline_key,
    audit_counter_key,
)

logger = logging.getLogger(__name__)


class AuditLogger:
    def __init__(self, redis: Redis):
        self.redis = redis

    async def log_event(
        self,
        case_id: str,
        event_type: AuditEventType,
        action_summary: str,
        actor_id: str = "OFFICER_CURRENT",
        actor_role: str = "INVESTIGATING_OFFICER",
        target_entity: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
        client_ip: str = "127.0.0.1",
    ) -> AuditEvent:
        """Log an immutable audit event to Redis sorted set."""
        ts = timestamp or datetime.utcnow()
        count = await self.redis.incr(audit_counter_key(case_id))
        event_id = f"AUD-{count:04d}"

        event = AuditEvent(
            id=event_id,
            case_id=case_id,
            actor_id=actor_id,
            actor_role=actor_role,
            event_type=event_type,
            action_summary=action_summary,
            target_entity=target_entity,
            metadata=metadata or {},
            timestamp=ts,
            client_ip=client_ip,
        )

        event_json = event.model_dump_json()
        score = ts.timestamp() * 1000.0  # Epoch milliseconds for accurate chronological sorting

        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.set(audit_event_key(case_id, event_id), event_json)
            pipe.zadd(audit_timeline_key(case_id), {event_id: score})
            await pipe.execute()

        logger.info(
            "Logged audit event %s (%s) for Case %s by %s",
            event_id, event_type.value, case_id, actor_id
        )
        return event

    async def get_audit_trail(
        self,
        case_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> List[AuditEvent]:
        """Fetch chronological audit trail for a case."""
        event_ids = await self.redis.zrange(
            audit_timeline_key(case_id),
            start=offset,
            end=offset + limit - 1,
        )
        if not event_ids:
            return []

        clean_ids = [eid.decode("utf-8") if isinstance(eid, bytes) else str(eid) for eid in event_ids]
        keys = [audit_event_key(case_id, eid) for eid in clean_ids]
        raw_events = await self.redis.mget(keys)

        events: List[AuditEvent] = []
        for raw in raw_events:
            if raw:
                events.append(AuditEvent.model_validate_json(raw))
        return events
