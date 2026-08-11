"""Rank feed posts using engagement metadata and recency decay."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def _to_datetime(value: datetime | str | None) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return datetime.now(timezone.utc)


def engagement_score(
    *,
    like_count: int = 0,
    comment_count: int = 0,
    view_count: int = 0,
    created_at: datetime | str | None = None,
) -> float:
    """Higher score = more relevant for the main feed."""
    created = _to_datetime(created_at)
    age_hours = max(0.0, (datetime.now(timezone.utc) - created).total_seconds() / 3600)
    recency_decay = 1.0 / (1.0 + age_hours / 48.0)
    engagement = like_count * 3 + comment_count * 5 + view_count * 0.1
    return engagement * recency_decay


def rank_posts(posts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(
        posts,
        key=lambda post: engagement_score(
            like_count=int(post.get("like_count") or 0),
            comment_count=int(post.get("comment_count") or 0),
            view_count=int(post.get("view_count") or 0),
            created_at=post.get("created_at"),
        ),
        reverse=True,
    )


def feed_rank_order_sql(table_alias: str = "p") -> str:
    alias = table_alias
    return f"""(
        ({alias}.like_count * 3 + {alias}.comment_count * 5 + COALESCE({alias}.view_count, 0) * 0.1)
        / (1 + EXTRACT(EPOCH FROM (NOW() - {alias}.created_at)) / 172800.0)
    ) DESC, {alias}.created_at DESC"""
