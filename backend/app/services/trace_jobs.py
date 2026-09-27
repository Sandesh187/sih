import json
from typing import Any, Optional

from pydantic import BaseModel
from redis.asyncio import Redis

from app.config import settings

TRACE_QUEUE_KEY = "vasp:trace:queue"
TRACE_PROCESSING_KEY = "vasp:trace:processing"
TRACE_STATE_KEY_PREFIX = "vasp:trace:state:"


class TraceJob(BaseModel):
    trace_id: str
    address: str
    chain: str
    max_depth: int


def state_key(trace_id: str) -> str:
    return f"{TRACE_STATE_KEY_PREFIX}{trace_id}"


async def enqueue_trace(redis: Redis, job: TraceJob) -> None:
    state = {"status": "queued"}
    async with redis.pipeline(transaction=True) as pipeline:
        pipeline.setex(state_key(job.trace_id), settings.TRACE_RESULT_TTL_SECONDS, json.dumps(state))
        pipeline.rpush(TRACE_QUEUE_KEY, job.model_dump_json())
        await pipeline.execute()


async def save_trace_state(redis: Redis, trace_id: str, state: dict[str, Any]) -> None:
    await redis.setex(state_key(trace_id), settings.TRACE_RESULT_TTL_SECONDS, json.dumps(state))


async def load_trace_state(redis: Redis, trace_id: str) -> Optional[dict[str, Any]]:
    raw_state = await redis.get(state_key(trace_id))
    return json.loads(raw_state) if raw_state else None
