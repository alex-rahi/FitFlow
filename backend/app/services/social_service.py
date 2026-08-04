from uuid import UUID

from app.db.pool import get_pool
from app.models.schemas import CommentCreate, CommentResponse, UserProfile


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
    pool = await get_pool()
    row = await pool.fetchrow(
        """INSERT INTO comments (user_id, post_id, content)
           VALUES ($1, $2, $3) RETURNING *""",
        user_id, post_id, data.content,
    )
    await pool.execute(
        "UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1", post_id
    )
    author_row = await pool.fetchrow("SELECT * FROM profiles WHERE id = $1", user_id)
    author = UserProfile(**dict(author_row)) if author_row else None
    return CommentResponse(**dict(row), author=author)


async def get_comments(post_id: UUID, limit: int = 50) -> list[CommentResponse]:
    pool = await get_pool()
    rows = await pool.fetch(
        """SELECT c.*, p.username, p.display_name, p.avatar_url
           FROM comments c JOIN profiles p ON c.user_id = p.id
           WHERE c.post_id = $1 ORDER BY c.created_at ASC LIMIT $2""",
        post_id, limit,
    )
    results = []
    for r in rows:
        d = dict(r)
        author = UserProfile(
            id=d["user_id"], username=d["username"],
            display_name=d["display_name"], avatar_url=d["avatar_url"],
        )
        results.append(CommentResponse(
            id=d["id"], user_id=d["user_id"], post_id=d["post_id"],
            content=d["content"], created_at=d["created_at"], author=author,
        ))
    return results


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
