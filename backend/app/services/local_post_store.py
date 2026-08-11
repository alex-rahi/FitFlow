"""In-memory post store for local YOLO pipeline (docker / dev)."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from app.data.placeholders import PLACEHOLDER_AUTHORS
from app.models.schemas import PostResponse, PostStatus, UserProfile


_local_posts: dict[UUID, dict] = {}
_local_jobs: dict[UUID, dict] = {}
_local_review_queue: dict[UUID, dict] = {}


def _author(user_id: UUID) -> UserProfile:
    author_data = PLACEHOLDER_AUTHORS.get(user_id, {"username": "you", "display_name": "You"})
    return UserProfile(
        id=user_id,
        username=author_data["username"],
        display_name=author_data["display_name"],
    )


def create_local_post(
    user_id: UUID,
    caption: str | None,
    category: str,
    media_type: str = "video",
) -> PostResponse:
    post_id = uuid4()
    ext = "jpg" if media_type == "photo" else "mp4" if media_type == "video" else "txt"
    storage_path = f"{user_id}/{post_id}.{ext}"
    post = {
        "id": post_id,
        "user_id": user_id,
        "caption": caption,
        "category": category,
        "media_type": media_type,
        "raw_video_url": storage_path,
        "processed_video_url": None,
        "thumbnail_url": None,
        "duration_seconds": None,
        "status": PostStatus.UPLOADING.value,
        "moderation_decision": None,
        "like_count": 0,
        "comment_count": 0,
        "view_count": 0,
        "created_at": datetime.now(timezone.utc),
        "detection_labels": [],
    }
    _local_posts[post_id] = post
    _local_jobs[post_id] = {"status": "awaiting_upload", "detections": [], "rules": []}
    return PostResponse(**post, author=_author(user_id))


def get_local_post(post_id: UUID) -> PostResponse | None:
    post = _local_posts.get(post_id)
    if not post:
        return None
    return PostResponse(**post, author=_author(post["user_id"]))


def mark_local_uploading(post_id: UUID) -> PostResponse:
    post = _local_posts[post_id]
    post["status"] = PostStatus.PROCESSING.value
    return PostResponse(**post, author=_author(post["user_id"]))


def _enqueue_local_review(post_id: UUID, result: dict) -> None:
    review_id = uuid4()
    priority = 10 if result.get("moderation_decision") == "manual_review" else 5
    _local_review_queue[review_id] = {
        "id": review_id,
        "post_id": post_id,
        "priority": priority,
        "review_status": "pending",
        "created_at": datetime.now(timezone.utc),
        "detections": result.get("detections", []),
        "moderation_scores": result.get("moderation_scores", []),
    }


def apply_moderation_result(post_id: UUID, result: dict) -> PostResponse:
    post = _local_posts[post_id]
    post["status"] = result.get("status", PostStatus.PUBLISHED.value)
    post["moderation_decision"] = result.get("moderation_decision", "publish")
    post["detection_labels"] = result.get("detection_labels", [])
    post["duration_seconds"] = result.get("duration_seconds")
    _local_jobs[post_id] = {
        "status": "completed",
        "detections": result.get("detections", []),
        "moderation_scores": result.get("moderation_scores", []),
        "rules": result.get("rules", []),
    }
    if post["status"] == PostStatus.PENDING_REVIEW.value:
        _enqueue_local_review(post_id, result)
    return PostResponse(**post, author=_author(post["user_id"]))


def list_published_local_posts() -> list[PostResponse]:
    return [
        PostResponse(**post, author=_author(post["user_id"]))
        for post in _local_posts.values()
        if post["status"] == PostStatus.PUBLISHED.value
    ]


def list_local_review_queue(limit: int = 50) -> list[dict]:
    items = sorted(
        _local_review_queue.values(),
        key=lambda item: (-item["priority"], item["created_at"]),
    )[:limit]
    return [item for item in items if item["review_status"] == "pending"]


def submit_local_review(review_id: UUID, outcome: str, notes: str | None = None) -> bool:
    item = _local_review_queue.get(review_id)
    if not item or item["review_status"] != "pending":
        return False

    post = _local_posts.get(item["post_id"])
    if not post:
        return False

    status_map = {
        "publish": PostStatus.PUBLISHED.value,
        "approve": PostStatus.PUBLISHED.value,
        "reject": PostStatus.REJECTED.value,
        "age_restrict": PostStatus.AGE_RESTRICTED.value,
    }
    post["status"] = status_map.get(outcome, PostStatus.PENDING_REVIEW.value)
    post["moderation_decision"] = outcome
    item["review_status"] = "completed"
    item["reviewer_notes"] = notes
    return True
