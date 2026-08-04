"""Main processing pipeline — orchestrates frame extraction, AI models, and rules."""

import json
import logging
import os
import tempfile
from uuid import UUID

import asyncpg

from app.config import settings
from app.pipeline.frame_extractor import extract_frames, generate_thumbnail, get_video_duration
from app.pipeline.moderation import aggregate_moderation_scores, moderate_frame
from app.pipeline.yolo_detector import detect_objects
from app.rules.engine import EvaluationContext, Outcome, evaluate_all_rules

logger = logging.getLogger(__name__)


async def process_job(pool: asyncpg.Pool, job: dict):
    post_id = job["post_id"]
    job_id = job["id"]
    logger.info("Processing job %s for post %s", job_id, post_id)

    await _update_job(pool, job_id, "running", "downloading_video", 0.1)

    post = await pool.fetchrow("SELECT * FROM posts WHERE id = $1", post_id)
    if not post:
        await _fail_job(pool, job_id, "Post not found")
        return

    user = await pool.fetchrow("SELECT * FROM profiles WHERE id = $1", post["user_id"])

    with tempfile.TemporaryDirectory() as tmpdir:
        video_path = os.path.join(tmpdir, "video.mp4")
        # In production, download from Supabase Storage
        # For now, skip if file doesn't exist and use mock pipeline
        if not os.path.exists(video_path):
            logger.info("No local video — running mock pipeline for post %s", post_id)
            video_path = None

        all_detections: list[dict] = []
        all_mod_scores: list[dict] = []

        if video_path:
            await _update_job(pool, job_id, "running", "frame_extraction", 0.2)
            frames = extract_frames(video_path, settings.frame_extract_interval)
            duration = get_video_duration(video_path)

            await _update_job(pool, job_id, "running", "yolo_detection", 0.4)
            frame_mod_scores = []
            for timestamp, frame in frames:
                dets = detect_objects(frame, settings.yolo_model_path)
                for d in dets:
                    d["frame_timestamp"] = timestamp
                all_detections.extend(dets)

                mod = moderate_frame(frame, settings.moderation_threshold)
                frame_mod_scores.append(mod)

            all_mod_scores = aggregate_moderation_scores(frame_mod_scores)

            thumb_path = os.path.join(tmpdir, "thumb.jpg")
            try:
                generate_thumbnail(video_path, thumb_path)
            except ValueError:
                pass

            await pool.execute(
                "UPDATE posts SET duration_seconds = $1 WHERE id = $2", duration, post_id
            )
        else:
            all_detections = detect_objects(None, settings.yolo_model_path)  # type: ignore
            all_mod_scores = [
                {"category": "explicit_content", "score": 0.05},
                {"category": "violence_gore", "score": 0.02},
                {"category": "nudity", "score": 0.08},
                {"category": "unsafe_activity", "score": 0.12},
            ]

        await _update_job(pool, job_id, "running", "saving_results", 0.7)

        for det in all_detections:
            await pool.execute(
                """INSERT INTO ai_detections
                   (post_id, frame_timestamp, detection_type, label, confidence, bounding_box)
                   VALUES ($1, $2, $3, $4, $5, $6)""",
                post_id,
                det.get("frame_timestamp", 0),
                det["detection_type"],
                det["label"],
                det["confidence"],
                json.dumps(det.get("bounding_box")),
            )

        for score in all_mod_scores:
            await pool.execute(
                """INSERT INTO moderation_scores (post_id, category, score)
                   VALUES ($1, $2, $3)""",
                post_id, score["category"], score["score"],
            )

        await _update_job(pool, job_id, "running", "business_rules", 0.85)

        prior_violations = await pool.fetchval(
            """SELECT COUNT(*) FROM moderation_decisions
               WHERE post_id IN (SELECT id FROM posts WHERE user_id = $1)
               AND final_outcome IN ('reject', 'flag_for_review')""",
            post["user_id"],
        )

        ctx = EvaluationContext(
            detections=all_detections,
            moderation_scores=all_mod_scores,
            user_trust_level=user["trust_level"] if user else 0,
            user_age_verified=user["age_verified"] if user else False,
            prior_violations=prior_violations or 0,
        )

        final_outcome, rule_results = evaluate_all_rules(ctx, settings.moderation_threshold)

        for rr in rule_results:
            await pool.execute(
                """INSERT INTO rule_evaluations
                   (post_id, rule_name, outcome, confidence, details)
                   VALUES ($1, $2, $3, $4, $5)""",
                post_id, rr.rule_name, rr.outcome.value, rr.confidence,
                json.dumps(rr.details),
            )

        status_map = {
            Outcome.PUBLISH: "published",
            Outcome.APPROVE: "approved",
            Outcome.REJECT: "rejected",
            Outcome.AGE_RESTRICT: "age_restricted",
            Outcome.FLAG_FOR_REVIEW: "flagged",
            Outcome.MANUAL_REVIEW: "pending_review",
        }
        post_status = status_map.get(final_outcome, "pending_review")

        await pool.execute(
            """UPDATE posts SET status = $1, moderation_decision = $2 WHERE id = $3""",
            post_status, final_outcome.value, post_id,
        )

        await pool.execute(
            """INSERT INTO moderation_decisions
               (post_id, final_outcome, reason, auto_decided)
               VALUES ($1, $2, $3, true)""",
            post_id, final_outcome.value,
            f"Auto-decided by rules engine: {final_outcome.value}",
        )

        if final_outcome in (Outcome.FLAG_FOR_REVIEW, Outcome.MANUAL_REVIEW):
            priority = 10 if final_outcome == Outcome.MANUAL_REVIEW else 5
            await pool.execute(
                """INSERT INTO review_queue (post_id, priority, review_status)
                   VALUES ($1, $2, 'pending')""",
                post_id, priority,
            )

        await pool.execute(
            """INSERT INTO audit_log (action, resource_type, resource_id, details)
               VALUES ('auto_moderation', 'post', $1, $2)""",
            post_id,
            json.dumps({"outcome": final_outcome.value, "rules_evaluated": len(rule_results)}),
        )

        await _update_job(pool, job_id, "completed", "done", 1.0)
        logger.info("Job %s completed — outcome: %s", job_id, final_outcome.value)


async def _update_job(pool, job_id, status, step, progress):
    await pool.execute(
        """UPDATE processing_jobs SET status = $1, current_step = $2, progress = $3,
           started_at = COALESCE(started_at, NOW()) WHERE id = $4""",
        status, step, progress, job_id,
    )


async def _fail_job(pool, job_id, error):
    await pool.execute(
        """UPDATE processing_jobs SET status = 'failed', error_message = $1,
           completed_at = NOW() WHERE id = $2""",
        error, job_id,
    )
