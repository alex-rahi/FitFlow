from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException

from app.auth.jwt import get_current_user_id
from app.config import settings
from app.models.schemas import ModerationStats, ReviewAction, ReviewItem
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


def verify_admin(x_admin_secret: str = Header(...)):
    if x_admin_secret != settings.admin_secret:
        raise HTTPException(403, "Invalid admin credentials")


@router.get("/review-queue", response_model=list[ReviewItem])
async def get_review_queue(
    limit: int = 50, _: str = Depends(verify_admin)
):
    return await admin_service.get_review_queue(limit)


@router.post("/review/{review_id}", status_code=204)
async def submit_review(
    review_id: UUID,
    action: ReviewAction,
    user_id: UUID = Depends(get_current_user_id),
    _: str = Depends(verify_admin),
):
    success = await admin_service.submit_review(review_id, user_id, action)
    if not success:
        raise HTTPException(404, "Review item not found")


@router.get("/stats", response_model=ModerationStats)
async def get_stats(_: str = Depends(verify_admin)):
    return await admin_service.get_moderation_stats()


@router.get("/audit-log")
async def get_audit_log(limit: int = 100, _: str = Depends(verify_admin)):
    return await admin_service.get_audit_log(limit)
