from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.auth.jwt import get_current_user_id
from app.models.schemas import ProfileUpdate, UserProfile
from app.services import profile_service

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=UserProfile)
async def get_my_profile(user_id: UUID = Depends(get_current_user_id)):
    profile = await profile_service.get_profile(user_id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    return profile


@router.patch("/me", response_model=UserProfile)
async def update_my_profile(
    data: ProfileUpdate, user_id: UUID = Depends(get_current_user_id)
):
    profile = await profile_service.update_profile(user_id, data)
    if not profile:
        raise HTTPException(404, "Profile not found")
    return profile


@router.get("/search", response_model=list[UserProfile])
async def search_profiles(q: str, limit: int = 20):
    return await profile_service.search_profiles(q, limit)


@router.get("/{profile_id}", response_model=UserProfile)
async def get_profile(profile_id: UUID):
    profile = await profile_service.get_profile(profile_id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    return profile
