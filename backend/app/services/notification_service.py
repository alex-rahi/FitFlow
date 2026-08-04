from uuid import UUID

from app.config import settings
from app.data.placeholders import PLACEHOLDER_NOTIFICATIONS, PLACEHOLDER_USER_ID
from app.db.pool import get_pool
from app.models.schemas import NotificationResponse


async def get_notifications(user_id: UUID, limit: int = 50) -> list[NotificationResponse]:
    if settings.use_placeholders and user_id == PLACEHOLDER_USER_ID:
        return [NotificationResponse(**n) for n in PLACEHOLDER_NOTIFICATIONS]

    pool = await get_pool()
    rows = await pool.fetch(
        """SELECT * FROM notifications WHERE user_id = $1
           ORDER BY created_at DESC LIMIT $2""",
        user_id, limit,
    )
    return [NotificationResponse(**dict(r)) for r in rows]


async def mark_read(user_id: UUID, notification_id: UUID) -> bool:
    if settings.use_placeholders:
        return True

    pool = await get_pool()
    result = await pool.execute(
        """UPDATE notifications SET read = true
           WHERE id = $1 AND user_id = $2""",
        notification_id, user_id,
    )
    return result == "UPDATE 1"


async def mark_all_read(user_id: UUID) -> int:
    if settings.use_placeholders:
        return len(PLACEHOLDER_NOTIFICATIONS)

    pool = await get_pool()
    result = await pool.execute(
        "UPDATE notifications SET read = true WHERE user_id = $1 AND read = false",
        user_id,
    )
    return int(result.split()[-1]) if result else 0


async def create_notification(
    user_id: UUID, type: str, title: str, body: str | None = None, data: dict | None = None
) -> None:
    if settings.use_placeholders:
        return

    pool = await get_pool()
    import json
    await pool.execute(
        """INSERT INTO notifications (user_id, type, title, body, data)
           VALUES ($1, $2, $3, $4, $5)""",
        user_id, type, title, body, json.dumps(data) if data else None,
    )
