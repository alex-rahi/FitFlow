import uuid
from uuid import UUID

from app.config import settings
from app.data.placeholders import PLACEHOLDER_AUTHORS, PLACEHOLDER_COMMENTS
from app.db.pool import get_pool
from app.models.schemas import CommentCreate, CommentResponse, UserProfile
from app.services import notification_service


def _comment_to_response(row: dict) -> CommentResponse:
    author_data = PLACEHOLDER_AUTHORS.get(row["user_id"])
    author = None
    if author_data:
        author = UserProfile(
            id=row["user_id"],
            username=author_data["username"],
            display_name=author_data["display_name"],
        )
    elif "username" in row:
        author = UserProfile(
            id=row["user_id"],
            username=row["username"],
            display_name=row.get("display_name"),
            avatar_url=row.get("avatar_url"),
        )
    return CommentResponse(
        id=row["id"],
        user_id=row["user_id"],
        post_id=row["post_id"],
        parent_id=row.get("parent_id"),
        content=row["content"],
        like_count=row.get("like_count", 0),
        created_at=row["created_at"],
        author=author,
    )


async def like_post(user_id: UUID, post_id: UUID) -> bool:
    pool = await get_pool()
    try:
        await pool.execute(
            "INSERT INTO likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            user_id, post_id,
        )
        return True
    except Exception:
        return False


async def unlike_post(user_id: UUID, post_id: UUID) -> bool:
    pool = await get_pool()
    result = await pool.execute(
        "DELETE FROM likes WHERE user_id = $1 AND post_id = $2", user_id, post_id
    )
    return result == "DELETE 1"


async def is_liked(user_id: UUID, post_id: UUID) -> bool:
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2", user_id, post_id
    )
    return row is not None


async def add_comment(user_id: UUID, post_id: UUID, data: CommentCreate) -> CommentResponse:
    if settings.use_placeholders:
        from datetime import datetime, timezone
        from app.data.placeholders import PLACEHOLDER_USER_ID

        author_data = PLACEHOLDER_AUTHORS.get(user_id, {"username": "you", "display_name": "You"})
        row = {
            "id": uuid.uuid4(),
            "user_id": user_id if user_id else PLACEHOLDER_USER_ID,
            "post_id": post_id,
            "parent_id": data.parent_id,
            "content": data.content,
            "like_count": 0,
            "created_at": datetime.now(timezone.utc),
        }
        PLACEHOLDER_COMMENTS.append(row)
        return _comment_to_response(row)

    pool = await get_pool()
    post = await pool.fetchrow("SELECT id, user_id FROM posts WHERE id = $1", post_id)
    if not post:
        raise ValueError("Post not found")

    if data.parent_id:
        parent = await pool.fetchrow(
            "SELECT id, post_id, user_id FROM comments WHERE id = $1", data.parent_id
        )
        if not parent or parent["post_id"] != post_id:
            raise ValueError("Invalid parent comment")

    row = await pool.fetchrow(
        """INSERT INTO comments (user_id, post_id, parent_id, content)
           VALUES ($1, $2, $3, $4) RETURNING *""",
        user_id, post_id, data.parent_id, data.content,
    )

    notify_user = post["user_id"]
    if data.parent_id:
        parent = await pool.fetchrow("SELECT user_id FROM comments WHERE id = $1", data.parent_id)
        if parent and parent["user_id"] != user_id:
            notify_user = parent["user_id"]

    if notify_user != user_id:
        await notification_service.create_notification(
            notify_user,
            "comment",
            f"New reply on your thread",
            data.content[:100],
            {"post_id": str(post_id), "comment_id": str(row["id"])},
        )

    author_row = await pool.fetchrow("SELECT * FROM profiles WHERE id = $1", user_id)
    author = UserProfile(**dict(author_row)) if author_row else None
    return CommentResponse(**dict(row), author=author)


async def get_comments(post_id: UUID, limit: int = 50) -> list[CommentResponse]:
    if settings.use_placeholders:
        rows = [c for c in PLACEHOLDER_COMMENTS if c["post_id"] == post_id]
        rows.sort(key=lambda c: c["created_at"])
        return [_comment_to_response(dict(c)) for c in rows[:limit]]

    pool = await get_pool()
    rows = await pool.fetch(
        """SELECT c.*, p.username, p.display_name, p.avatar_url
           FROM comments c JOIN profiles p ON c.user_id = p.id
           WHERE c.post_id = $1 ORDER BY c.created_at ASC LIMIT $2""",
        post_id, limit,
    )
    return [_comment_to_response(dict(r)) for r in rows]


async def follow_user(follower_id: UUID, following_id: UUID) -> bool:
    pool = await get_pool()
    try:
        await pool.execute(
            "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            follower_id, following_id,
        )
        return True
    except Exception:
        return False


async def unfollow_user(follower_id: UUID, following_id: UUID) -> bool:
    pool = await get_pool()
    result = await pool.execute(
        "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
        follower_id, following_id,
    )
    return result == "DELETE 1"


async def is_following(follower_id: UUID, following_id: UUID) -> bool:
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2",
        follower_id, following_id,
    )
    return row is not None
