from uuid import UUID

from app.config import settings
from app.data.placeholders import PLACEHOLDER_STATS
from app.db.pool import get_pool
from app.models.schemas import ModerationStats, PostResponse, ReviewAction, ReviewItem, RuleOutcome, UserProfile


async def get_review_queue(limit: int = 50) -> list[ReviewItem]:
    if settings.use_local_yolo:
        from app.services import local_post_store

        items = []
        for row in local_post_store.list_local_review_queue(limit):
            post = local_post_store.get_local_post(row["post_id"])
            items.append(ReviewItem(
                id=row["id"],
                post_id=row["post_id"],
                priority=row["priority"],
                review_status=row["review_status"],
                post=post,
                detections=row.get("detections", []),
                moderation_scores=row.get("moderation_scores", []),
                created_at=row["created_at"],
            ))
        return items

    pool = await get_pool()
    rows = await pool.fetch(
        """SELECT rq.* FROM review_queue rq
           WHERE rq.review_status = 'pending'
           ORDER BY rq.priority DESC, rq.created_at ASC LIMIT $1""",
        limit,
    )
    items = []
    for r in rows:
        post_row = await pool.fetchrow("SELECT * FROM posts WHERE id = $1", r["post_id"])
        post = None
        if post_row:
            author_row = await pool.fetchrow(
                "SELECT * FROM profiles WHERE id = $1", post_row["user_id"]
            )
            author = UserProfile(**dict(author_row)) if author_row else None
            post = PostResponse(**dict(post_row), author=author)

        detections = await pool.fetch(
            "SELECT * FROM ai_detections WHERE post_id = $1 ORDER BY frame_timestamp", r["post_id"]
        )
        scores = await pool.fetch(
            "SELECT * FROM moderation_scores WHERE post_id = $1", r["post_id"]
        )
        items.append(ReviewItem(
            id=r["id"], post_id=r["post_id"], priority=r["priority"],
            review_status=r["review_status"], post=post,
            detections=[dict(d) for d in detections],
            moderation_scores=[dict(s) for s in scores],
            created_at=r["created_at"],
        ))
    return items


async def submit_review(review_id: UUID, reviewer_id: UUID, action: ReviewAction) -> bool:
    if settings.use_local_yolo:
        from app.services import local_post_store

        return local_post_store.submit_local_review(
            review_id, action.action.value, action.notes
        )

    pool = await get_pool()
    row = await pool.fetchrow("SELECT * FROM review_queue WHERE id = $1", review_id)
    if not row:
        return False

    post_id = row["post_id"]
    outcome = action.action

    status_map = {
        RuleOutcome.APPROVE: "approved",
        RuleOutcome.PUBLISH: "published",
        RuleOutcome.REJECT: "rejected",
        RuleOutcome.AGE_RESTRICT: "age_restricted",
        RuleOutcome.FLAG_FOR_REVIEW: "flagged",
        RuleOutcome.MANUAL_REVIEW: "pending_review",
    }
    post_status = status_map.get(outcome, "pending_review")

    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute(
                """UPDATE review_queue SET review_status = 'completed',
                   reviewer_notes = $1, reviewed_at = NOW() WHERE id = $2""",
                action.notes, review_id,
            )
            await conn.execute(
                "UPDATE posts SET status = $1, moderation_decision = $2 WHERE id = $3",
                post_status, outcome.value, post_id,
            )
            await conn.execute(
                """INSERT INTO moderation_decisions
                   (post_id, final_outcome, reason, auto_decided, reviewer_id)
                   VALUES ($1, $2, $3, false, $4)""",
                post_id, outcome.value, action.notes, reviewer_id,
            )
            await conn.execute(
                """INSERT INTO audit_log (actor_id, action, resource_type, resource_id, details)
                   VALUES ($1, 'manual_review', 'post', $2, $3)""",
                reviewer_id, post_id,
                {"outcome": outcome.value, "notes": action.notes},
            )
    return True


async def get_moderation_stats() -> ModerationStats:
    if settings.use_placeholders:
        return ModerationStats(**PLACEHOLDER_STATS)

    pool = await get_pool()
    stats = await pool.fetchrow("""
        SELECT
            COUNT(*) AS total_posts,
            COUNT(*) FILTER (WHERE status = 'pending_review') AS pending_review,
            COUNT(*) FILTER (WHERE status IN ('approved', 'published')) AS approved,
            COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
            COUNT(*) FILTER (WHERE status = 'flagged') AS flagged
        FROM posts
    """)
    avg_time = await pool.fetchval("""
        SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))
        FROM processing_jobs WHERE status = 'completed'
    """)
    return ModerationStats(
        total_posts=stats["total_posts"],
        pending_review=stats["pending_review"],
        approved=stats["approved"],
        rejected=stats["rejected"],
        flagged=stats["flagged"],
        avg_processing_time_seconds=avg_time,
    )


async def get_audit_log(limit: int = 100) -> list[dict]:
    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1", limit
    )
    return [dict(r) for r in rows]
