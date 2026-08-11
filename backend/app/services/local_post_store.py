"""In-memory post store for local YOLO pipeline (docker / dev)."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from app.data.placeholders import PLACEHOLDER_AUTHORS
from app.models.schemas import PostResponse, PostStatus, UserProfile


_local_posts: dict[UUID, dict] = {}
_local_jobs: dict[UUID, dict] = {}


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
    return PostResponse(**post, author=_author(post["user_id"]))


def list_published_local_posts() -> list[PostResponse]:
    return [
        PostResponse(**post, author=_author(post["user_id"]))
        for post in _local_posts.values()
        if post["status"] == PostStatus.PUBLISHED.value
    ]
