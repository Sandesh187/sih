"""Run with: python -m app.worker"""
import asyncio
import json
import logging

import httpx
from redis.asyncio import Redis

from app.blockchain.ethereum import EthereumClient
from app.blockchain.tron import TronClient
from app.config import settings
from app.core.tracer import FundTracer
from app.services.trace_jobs import (
    TRACE_PROCESSING_KEY,
    TRACE_QUEUE_KEY,
    TraceJob,
    save_trace_state,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def recover_interrupted_jobs(redis: Redis) -> None:
    """Return jobs claimed by a crashed worker to the durable queue on worker startup."""
    interrupted_jobs = await redis.lrange(TRACE_PROCESSING_KEY, 0, -1)
    if not interrupted_jobs:
        return

    async with redis.pipeline(transaction=True) as pipeline:
        for raw_job in interrupted_jobs:
            pipeline.lrem(TRACE_PROCESSING_KEY, 1, raw_job)
            pipeline.rpush(TRACE_QUEUE_KEY, raw_job)
        await pipeline.execute()
    logger.warning("Requeued %d interrupted trace jobs", len(interrupted_jobs))


async def run_worker() -> None:
    redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    await redis.ping()
    await recover_interrupted_jobs(redis)

    async with httpx.AsyncClient(timeout=30.0) as http_client:
        tracer = FundTracer(EthereumClient(http_client), TronClient(http_client))
        while True:
            try:
                raw_job = await redis.brpoplpush(TRACE_QUEUE_KEY, TRACE_PROCESSING_KEY, timeout=5)
            except (TimeoutError, asyncio.CancelledError, Exception) as e:
                # redis.asyncio can raise TimeoutError or CancelledError on empty queues with blocking commands
                if isinstance(e, (TimeoutError, asyncio.CancelledError)) or "Timeout" in str(e):
                    continue
                raise
                
            if raw_job is None:
                continue

            try:
                job = TraceJob.model_validate_json(raw_job)
                await save_trace_state(redis, job.trace_id, {"status": "processing"})
                result = await tracer.trace_funds(job.address, job.chain, job.max_depth)
                result.trace_id = job.trace_id
                await save_trace_state(
                    redis,
                    job.trace_id,
                    {"status": "completed", "result": result.model_dump(mode="json")},
                )
            except Exception as error:
                logger.exception("Trace job failed")
                trace_id = json.loads(raw_job).get("trace_id", "unknown")
                await save_trace_state(redis, trace_id, {"status": "failed", "error": str(error)})
            finally:
                await redis.lrem(TRACE_PROCESSING_KEY, 1, raw_job)


if __name__ == "__main__":
    asyncio.run(run_worker())
