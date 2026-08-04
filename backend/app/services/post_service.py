import uuid
from uuid import UUID

from app.config import settings
from app.data.placeholders import PLACEHOLDER_AUTHORS, PLACEHOLDER_POSTS, PLACEHOLDER_USER_ID
from app.db.pool import get_pool
from app.models.schemas import PostCreate, PostResponse, PostStatus, UploadUrlResponse, UserProfile


def _placeholder_post_response(post_dict: dict) -> PostResponse:
    author_data = PLACEHOLDER_AUTHORS.get(post_dict["user_id"], {"username": "user", "display_name": "User"})
    author = UserProfile(
        id=post_dict["user_id"],
        username=author_data["username"],
        display_name=author_data["display_name"],
    )
    return PostResponse(**post_dict, author=author)


async def _attach_author(post_dict: dict) -> PostResponse:
    if settings.use_placeholders and post_dict["user_id"] in PLACEHOLDER_AUTHORS:
        return _placeholder_post_response(post_dict)

    pool = await get_pool()
    author_row = await pool.fetchrow(
        "SELECT * FROM profiles WHERE id = $1", post_dict["user_id"]
    )
    author = UserProfile(**dict(author_row)) if author_row else None
    return PostResponse(**post_dict, author=author)


async def create_post(user_id: UUID, data: PostCreate) -> PostResponse:
    pool = await get_pool()
    post_id = uuid.uuid4()
    storage_path = f"{user_id}/{post_id}.mp4"

    row = await pool.fetchrow(
        """INSERT INTO posts (id, user_id, caption, raw_video_url, status)
           VALUES ($1, $2, $3, $4, $5) RETURNING *""",
        post_id, user_id, data.caption, storage_path, PostStatus.UPLOADING.value,
    )

    await pool.execute(
        """INSERT INTO processing_jobs (post_id, status, current_step)
           VALUES ($1, 'queued', 'awaiting_upload')""",
        post_id,
    )

    return await _attach_author(dict(row))


async def get_upload_url(user_id: UUID, post_id: UUID) -> UploadUrlResponse:
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT * FROM posts WHERE id = $1 AND user_id = $2", post_id, user_id
    )
    if not row:
        raise ValueError("Post not found")

    storage_path = row["raw_video_url"]
    upload_url = (
        f"{settings.supabase_url}/storage/v1/object/{settings.storage_bucket_raw}/{storage_path}"
    )
    return UploadUrlResponse(post_id=post_id, upload_url=upload_url, storage_path=storage_path)


async def confirm_upload(user_id: UUID, post_id: UUID) -> PostResponse:
    pool = await get_pool()
    row = await pool.fetchrow(
        """UPDATE posts SET status = $1
           WHERE id = $2 AND user_id = $3 RETURNING *""",
        PostStatus.PROCESSING.value, post_id, user_id,
    )
    if not row:
        raise ValueError("Post not found")

    await pool.execute(
        """UPDATE processing_jobs SET status = 'queued', current_step = 'frame_extraction'
           WHERE post_id = $1""",
        post_id,
    )
    return await _attach_author(dict(row))


async def get_post(post_id: UUID) -> PostResponse | None:
    pool = await get_pool()
    row = await pool.fetchrow("SELECT * FROM posts WHERE id = $1", post_id)
    if not row:
        return None
    return await _attach_author(dict(row))


async def get_user_posts(user_id: UUID, limit: int = 20, cursor: str | None = None) -> list[PostResponse]:
    pool = await get_pool()
    if cursor:
        rows = await pool.fetch(
            """SELECT * FROM posts WHERE user_id = $1 AND created_at < $2
               ORDER BY created_at DESC LIMIT $3""",
            user_id, cursor, limit,
        )
    else:
        rows = await pool.fetch(
            "SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
            user_id, limit,
        )
    return [await _attach_author(dict(r)) for r in rows]


async def get_feed(user_id: UUID | None, limit: int = 20, cursor: str | None = None) -> list[PostResponse]:
    if settings.use_placeholders:
        posts = PLACEHOLDER_POSTS[:limit]
        return [_placeholder_post_response(dict(p)) for p in posts]

    pool = await get_pool()
    if user_id:
        query = """
            SELECT p.* FROM posts p
            WHERE p.status = 'published'
              AND (p.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
                   OR p.user_id = $1)
        """
        params: list = [user_id]
        if cursor:
            query += " AND p.created_at < $2 ORDER BY p.created_at DESC LIMIT $3"
            params.extend([cursor, limit])
        else:
            query += " ORDER BY p.created_at DESC LIMIT $2"
            params.append(limit)
        rows = await pool.fetch(query, *params)
    else:
        if cursor:
            rows = await pool.fetch(
                """SELECT * FROM posts WHERE status = 'published' AND created_at < $1
                   ORDER BY created_at DESC LIMIT $2""",
                cursor, limit,
            )
        else:
            rows = await pool.fetch(
                "SELECT * FROM posts WHERE status = 'published' ORDER BY created_at DESC LIMIT $1",
                limit,
            )
    return [await _attach_author(dict(r)) for r in rows]
