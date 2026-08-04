from uuid import UUID

from app.config import settings
from app.data.placeholders import PLACEHOLDER_PROFILE, PLACEHOLDER_USERS, PLACEHOLDER_USER_ID
from app.db.pool import get_pool
from app.models.schemas import ProfileUpdate, UserProfile


async def get_profile(user_id: UUID) -> UserProfile | None:
    if settings.use_placeholders and user_id == PLACEHOLDER_USER_ID:
        return UserProfile(**PLACEHOLDER_PROFILE)

    pool = await get_pool()
    row = await pool.fetchrow("SELECT * FROM profiles WHERE id = $1", user_id)
    if not row:
        return None
    return UserProfile(**dict(row))


async def update_profile(user_id: UUID, data: ProfileUpdate) -> UserProfile | None:
    pool = await get_pool()
    fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not fields:
        return await get_profile(user_id)

    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(fields))
    values = list(fields.values())
    row = await pool.fetchrow(
        f"UPDATE profiles SET {set_clause} WHERE id = $1 RETURNING *",
        user_id, *values,
    )
    return UserProfile(**dict(row)) if row else None


async def search_profiles(query: str, limit: int = 20) -> list[UserProfile]:
    if settings.use_placeholders:
        q = query.lower()
        matches = [
            UserProfile(**u) for u in PLACEHOLDER_USERS
            if q in u["username"].lower() or (u.get("display_name") and q in u["display_name"].lower())
        ]
        return matches[:limit]

    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT * FROM profiles WHERE username ILIKE $1 OR display_name ILIKE $1 LIMIT $2",
        f"%{query}%", limit,
    )
    return [UserProfile(**dict(r)) for r in rows]
