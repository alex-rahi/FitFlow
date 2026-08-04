from uuid import UUID

from fastapi import APIRouter, Depends

from app.auth.jwt import get_current_user_id
from app.models.schemas import NotificationResponse
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    limit: int = 50, user_id: UUID = Depends(get_current_user_id)
):
    return await notification_service.get_notifications(user_id, limit)


@router.patch("/{notification_id}/read", status_code=204)
async def mark_notification_read(
    notification_id: UUID, user_id: UUID = Depends(get_current_user_id)
):
    await notification_service.mark_read(user_id, notification_id)


@router.post("/read-all", status_code=204)
async def mark_all_read(user_id: UUID = Depends(get_current_user_id)):
    await notification_service.mark_all_read(user_id)
