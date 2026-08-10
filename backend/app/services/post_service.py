import uuid
from datetime import datetime, timezone
from uuid import UUID

from app.config import settings
from app.data.placeholders import PLACEHOLDER_AUTHORS, PLACEHOLDER_POSTS, PLACEHOLDER_USER_ID
from app.db.pool import get_pool
from app.integrations.storage import create_signed_upload_url
from app.models.categories import PostCategory
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
    if settings.use_placeholders:
        post_id = uuid.uuid4()
        storage_path = f"{user_id}/{post_id}.mp4"
        post_dict = {
            "id": post_id,
            "user_id": user_id,
            "caption": data.caption,
            "category": data.category.value,
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
        }
        return _placeholder_post_response(post_dict)

    pool = await get_pool()
    post_id = uuid.uuid4()
    storage_path = f"{user_id}/{post_id}.mp4"

    row = await pool.fetchrow(
        """INSERT INTO posts (id, user_id, caption, category, raw_video_url, status)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *""",
        post_id, user_id, data.caption, data.category.value, storage_path, PostStatus.UPLOADING.value,
    )

    await pool.execute(
        """INSERT INTO processing_jobs (post_id, status, current_step)
           VALUES ($1, 'queued', 'awaiting_upload')""",
        post_id,
    )

    return await _attach_author(dict(row))


async def get_upload_url(user_id: UUID, post_id: UUID) -> UploadUrlResponse:
    if settings.use_placeholders:
        storage_path = f"{user_id}/{post_id}.mp4"
        return UploadUrlResponse(
            post_id=post_id,
            upload_url=f"{settings.supabase_url}/storage/v1/object/{settings.storage_bucket_raw}/{storage_path}",
            storage_path=storage_path,
        )

    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT * FROM posts WHERE id = $1 AND user_id = $2", post_id, user_id
    )
    if not row:
        raise ValueError("Post not found")

    storage_path = row["raw_video_url"]
    upload_url = create_signed_upload_url(storage_path)
    return UploadUrlResponse(post_id=post_id, upload_url=upload_url, storage_path=storage_path)


async def confirm_upload(user_id: UUID, post_id: UUID) -> PostResponse:
    if settings.use_placeholders:
        post_dict = {
            "id": post_id,
            "user_id": user_id,
            "caption": None,
            "category": PostCategory.MEAL_PREP,
            "raw_video_url": f"{user_id}/{post_id}.mp4",
            "processed_video_url": None,
            "thumbnail_url": None,
            "duration_seconds": None,
            "status": PostStatus.PROCESSING.value,
            "moderation_decision": "pending",
            "like_count": 0,
            "comment_count": 0,
            "view_count": 0,
            "created_at": datetime.now(timezone.utc),
        }
        return _placeholder_post_response(post_dict)

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


async def get_feed(
    user_id: UUID | None,
    limit: int = 20,
    cursor: str | None = None,
    category: PostCategory | None = None,
) -> list[PostResponse]:
    if settings.use_placeholders:
        posts = PLACEHOLDER_POSTS
        if category and category != PostCategory.MAIN_FEED:
            posts = [p for p in posts if p.get("category") == category.value]
        return [_placeholder_post_response(dict(p)) for p in posts[:limit]]

    pool = await get_pool()
    category_clause = ""
    category_param: list = []
    if category and category != PostCategory.MAIN_FEED:
        category_clause = " AND p.category = $CATEGORY$"
        category_param = [category.value]

    if user_id:
        query = f"""
            SELECT p.* FROM posts p
            WHERE p.status = 'published'
              AND (p.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
                   OR p.user_id = $1)
              {category_clause.replace('$CATEGORY$', '$2' if category_param else '')}
        """
        params: list = [user_id, *category_param]
        cursor_idx = len(params) + 1
        limit_idx = cursor_idx + 1
        if cursor:
            query += f" AND p.created_at < ${cursor_idx} ORDER BY p.created_at DESC LIMIT ${limit_idx}"
            params.extend([cursor, limit])
        else:
            query += f" ORDER BY p.created_at DESC LIMIT ${cursor_idx}"
            params.append(limit)
        rows = await pool.fetch(query, *params)
    else:
        if category and category != PostCategory.MAIN_FEED:
            if cursor:
                rows = await pool.fetch(
                    """SELECT * FROM posts WHERE status = 'published'
                       AND category = $1 AND created_at < $2
                       ORDER BY created_at DESC LIMIT $3""",
                    category.value, cursor, limit,
                )
            else:
                rows = await pool.fetch(
                    """SELECT * FROM posts WHERE status = 'published' AND category = $1
                       ORDER BY created_at DESC LIMIT $2""",
                    category.value, limit,
                )
        elif cursor:
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
