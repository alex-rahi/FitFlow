"""Placeholder data returned when USE_PLACEHOLDERS=true and DB is unavailable."""

from datetime import datetime, timezone
from uuid import UUID

PLACEHOLDER_USER_ID = UUID("00000000-0000-4000-8000-000000000001")

PLACEHOLDER_PROFILE = {
    "id": PLACEHOLDER_USER_ID,
    "username": "alex_lifts",
    "display_name": "Alex Lifts",
    "avatar_url": None,
    "bio": "Placeholder profile — swap in real Supabase credentials to go live.",
    "trust_level": 85,
    "follower_count": 1284,
    "following_count": 312,
    "post_count": 47,
    "created_at": datetime(2025, 1, 15, 10, 0, tzinfo=timezone.utc),
}

PLACEHOLDER_POSTS = [
    {
        "id": UUID("10000000-0000-4000-8000-000000000001"),
        "user_id": PLACEHOLDER_USER_ID,
        "caption": "Heavy deadlift PR — 405 lbs 💪 Form check welcome!",
        "raw_video_url": None,
        "processed_video_url": None,
        "thumbnail_url": None,
        "duration_seconds": 32.0,
        "status": "published",
        "moderation_decision": "publish",
        "like_count": 842,
        "comment_count": 56,
        "view_count": 12400,
        "created_at": datetime(2025, 7, 28, 18, 30, tzinfo=timezone.utc),
    },
    {
        "id": UUID("10000000-0000-4000-8000-000000000002"),
        "user_id": UUID("00000000-0000-4000-8000-000000000002"),
        "caption": "Morning leg day — squats & lunges 🔥",
        "raw_video_url": None,
        "processed_video_url": None,
        "thumbnail_url": None,
        "duration_seconds": 45.0,
        "status": "published",
        "moderation_decision": "publish",
        "like_count": 1203,
        "comment_count": 89,
        "view_count": 18700,
        "created_at": datetime(2025, 7, 27, 9, 15, tzinfo=timezone.utc),
    },
    {
        "id": UUID("10000000-0000-4000-8000-000000000003"),
        "user_id": UUID("00000000-0000-4000-8000-000000000003"),
        "caption": "Bench press 225x5 — slow & controlled reps",
        "raw_video_url": None,
        "processed_video_url": None,
        "thumbnail_url": None,
        "duration_seconds": 28.0,
        "status": "published",
        "moderation_decision": "publish",
        "like_count": 567,
        "comment_count": 34,
        "view_count": 9200,
        "created_at": datetime(2025, 7, 26, 20, 0, tzinfo=timezone.utc),
    },
]

PLACEHOLDER_AUTHORS = {
    PLACEHOLDER_USER_ID: {"username": "alex_lifts", "display_name": "Alex Lifts"},
    UUID("00000000-0000-4000-8000-000000000002"): {"username": "fitness_jade", "display_name": "Jade Fitness"},
    UUID("00000000-0000-4000-8000-000000000003"): {"username": "bench_king", "display_name": "Bench King"},
}

PLACEHOLDER_USERS = [
    PLACEHOLDER_PROFILE,
    {
        "id": UUID("00000000-0000-4000-8000-000000000002"),
        "username": "fitness_jade",
        "display_name": "Jade Fitness",
        "avatar_url": None,
        "bio": "Certified trainer · HIIT & strength",
        "trust_level": 92,
        "follower_count": 8420,
        "following_count": 210,
        "post_count": 156,
        "created_at": datetime(2024, 6, 1, tzinfo=timezone.utc),
    },
    {
        "id": UUID("00000000-0000-4000-8000-000000000003"),
        "username": "bench_king",
        "display_name": "Bench King",
        "avatar_url": None,
        "bio": "Powerlifting · 405 bench goal",
        "trust_level": 78,
        "follower_count": 3200,
        "following_count": 89,
        "post_count": 72,
        "created_at": datetime(2024, 9, 15, tzinfo=timezone.utc),
    },
]

PLACEHOLDER_NOTIFICATIONS = [
    {
        "id": UUID("40000000-0000-4000-8000-000000000001"),
        "user_id": PLACEHOLDER_USER_ID,
        "type": "like",
        "title": "fitness_jade liked your video",
        "body": "Morning leg day — squats & lunges 🔥",
        "data": {"post_id": "10000000-0000-4000-8000-000000000001"},
        "read": False,
        "created_at": datetime(2025, 7, 30, 14, 0, tzinfo=timezone.utc),
    },
    {
        "id": UUID("40000000-0000-4000-8000-000000000002"),
        "user_id": PLACEHOLDER_USER_ID,
        "type": "follow",
        "title": "bench_king started following you",
        "body": None,
        "data": {"user_id": "00000000-0000-4000-8000-000000000003"},
        "read": False,
        "created_at": datetime(2025, 7, 30, 12, 30, tzinfo=timezone.utc),
    },
    {
        "id": UUID("40000000-0000-4000-8000-000000000003"),
        "user_id": PLACEHOLDER_USER_ID,
        "type": "comment",
        "title": "fitness_jade commented on your video",
        "body": "Great form on that deadlift! 💪",
        "data": {"post_id": "10000000-0000-4000-8000-000000000001"},
        "read": True,
        "created_at": datetime(2025, 7, 29, 18, 0, tzinfo=timezone.utc),
    },
]

PLACEHOLDER_STATS = {
    "total_posts": 1247,
    "pending_review": 8,
    "approved": 1102,
    "rejected": 89,
    "flagged": 48,
    "avg_processing_time_seconds": 12.4,
}
