from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.auth.jwt import get_current_user_id, get_optional_user_id
from app.models.schemas import FeedResponse, PostCreate, PostResponse, UploadUrlResponse
from app.services import post_service

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("", response_model=PostResponse, status_code=201)
async def create_post(data: PostCreate, user_id: UUID = Depends(get_current_user_id)):
    return await post_service.create_post(user_id, data)


@router.get("/feed", response_model=FeedResponse)
async def get_feed(
    limit: int = 20,
    cursor: str | None = None,
    user_id: UUID | None = Depends(get_optional_user_id),
):
    posts = await post_service.get_feed(user_id, limit, cursor)
    next_cursor = posts[-1].created_at.isoformat() if len(posts) == limit else None
    return FeedResponse(posts=posts, next_cursor=next_cursor)


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: UUID):
    post = await post_service.get_post(post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    return post


@router.get("/user/{user_id}", response_model=list[PostResponse])
async def get_user_posts(user_id: UUID, limit: int = 20, cursor: str | None = None):
    return await post_service.get_user_posts(user_id, limit, cursor)


@router.post("/{post_id}/upload-url", response_model=UploadUrlResponse)
async def get_upload_url(post_id: UUID, user_id: UUID = Depends(get_current_user_id)):
    try:
        return await post_service.get_upload_url(user_id, post_id)
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.post("/{post_id}/confirm-upload", response_model=PostResponse)
async def confirm_upload(post_id: UUID, user_id: UUID = Depends(get_current_user_id)):
    try:
        return await post_service.confirm_upload(user_id, post_id)
    except ValueError as e:
        raise HTTPException(404, str(e))
