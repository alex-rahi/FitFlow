from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.auth.jwt import get_current_user_id
from app.models.schemas import CommentCreate, CommentResponse
from app.services import social_service

router = APIRouter(tags=["social"])


@router.post("/posts/{post_id}/like", status_code=204)
async def like_post(post_id: UUID, user_id: UUID = Depends(get_current_user_id)):
    await social_service.like_post(user_id, post_id)


@router.delete("/posts/{post_id}/like", status_code=204)
async def unlike_post(post_id: UUID, user_id: UUID = Depends(get_current_user_id)):
    await social_service.unlike_post(user_id, post_id)


@router.get("/posts/{post_id}/comments", response_model=list[CommentResponse])
async def get_comments(post_id: UUID, limit: int = 50):
    return await social_service.get_comments(post_id, limit)


@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=201)
async def add_comment(
    post_id: UUID, data: CommentCreate, user_id: UUID = Depends(get_current_user_id)
):
    return await social_service.add_comment(user_id, post_id, data)


@router.post("/users/{target_id}/follow", status_code=204)
async def follow_user(target_id: UUID, user_id: UUID = Depends(get_current_user_id)):
    if target_id == user_id:
        raise HTTPException(400, "Cannot follow yourself")
    await social_service.follow_user(user_id, target_id)


@router.delete("/users/{target_id}/follow", status_code=204)
async def unfollow_user(target_id: UUID, user_id: UUID = Depends(get_current_user_id)):
    await social_service.unfollow_user(user_id, target_id)
