from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.auth.jwt import get_current_user_id
from app.config import settings
from app.models.schemas import PostResponse
from app.services import local_post_store, local_storage, moderation_client

router = APIRouter(prefix="/moderation", tags=["moderation"])


@router.get("/health")
async def moderation_health():
    if not settings.use_local_yolo:
        return {"enabled": False}
    try:
        worker = await moderation_client.worker_health()
        return {"enabled": True, "worker": worker}
    except Exception as exc:
        return {"enabled": True, "worker": {"status": "unreachable", "error": str(exc)}}


@router.post("/posts/{post_id}/upload", response_model=PostResponse)
async def upload_for_moderation(
    post_id: UUID,
    file: UploadFile = File(...),
    user_id=Depends(get_current_user_id),
):
    if not settings.use_local_yolo:
        raise HTTPException(404, "Local YOLO pipeline disabled")

    post = local_post_store.get_local_post(post_id)
    if not post or post.user_id != user_id:
        raise HTTPException(404, "Post not found")

    await local_storage.save_upload_file(post_id, post.raw_video_url or "", file)
    return local_post_store.mark_local_uploading(post_id)


@router.post("/posts/{post_id}/run", response_model=PostResponse)
async def run_local_moderation(post_id: UUID, user_id=Depends(get_current_user_id)):
    if not settings.use_local_yolo:
        raise HTTPException(404, "Local YOLO pipeline disabled")

    post = local_post_store.get_local_post(post_id)
    if not post or post.user_id != user_id:
        raise HTTPException(404, "Post not found")

    storage_path = post.raw_video_url or ""
    if post.status == "uploading" and not local_storage.upload_exists(storage_path):
        raise HTTPException(400, "Upload media before running moderation")

    try:
        if local_storage.upload_exists(storage_path):
            result = await moderation_client.analyze_storage_path(storage_path)
        else:
            # Text-only posts — skip YOLO, auto-publish
            result = {
                "status": "published",
                "moderation_decision": "publish",
                "detection_labels": [],
                "detections": [],
                "moderation_scores": [],
                "rules": [],
            }
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(502, f"YOLO worker failed: {exc}") from exc

    if result.get("status") == "rejected":
        updated = local_post_store.apply_moderation_result(post_id, result)
        raise HTTPException(422, "Post rejected by YOLO content moderation")

    return local_post_store.apply_moderation_result(post_id, result)
