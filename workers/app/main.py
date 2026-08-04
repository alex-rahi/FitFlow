"""Worker main loop — polls for queued processing jobs."""

import asyncio
import logging

import asyncpg

from app.config import settings
from app.pipeline.processor import process_job

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("gymtok-worker")


async def poll_jobs(pool: asyncpg.Pool):
    while True:
        try:
            job = await pool.fetchrow(
                """UPDATE processing_jobs SET status = 'running'
                   WHERE id = (
                       SELECT id FROM processing_jobs
                       WHERE status = 'queued'
                       ORDER BY created_at ASC
                       LIMIT 1
                       FOR UPDATE SKIP LOCKED
                   )
                   RETURNING *"""
            )
            if job:
                try:
                    await process_job(pool, dict(job))
                    await pool.execute(
                        "UPDATE processing_jobs SET completed_at = NOW() WHERE id = $1",
                        job["id"],
                    )
                except Exception as e:
                    logger.exception("Job %s failed", job["id"])
                    await pool.execute(
                        """UPDATE processing_jobs SET status = 'failed',
                           error_message = $1, completed_at = NOW() WHERE id = $2""",
                        str(e), job["id"],
                    )
            else:
                await asyncio.sleep(settings.poll_interval)
        except Exception:
            logger.exception("Poll loop error")
            await asyncio.sleep(settings.poll_interval)


async def main():
    logger.info("GymTok AI Worker starting — poll interval: %ds", settings.poll_interval)
    pool = await asyncpg.create_pool(settings.database_url, min_size=2, max_size=5)
    try:
        await poll_jobs(pool)
    finally:
        await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
