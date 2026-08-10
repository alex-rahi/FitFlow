from functools import lru_cache

from supabase import Client, create_client

from app.config import settings


@lru_cache
def get_supabase_admin() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def create_signed_upload_url(storage_path: str) -> str:
    bucket = settings.storage_bucket_raw
    result = get_supabase_admin().storage.from_(bucket).create_signed_upload_url(storage_path)
    if hasattr(result, "model_dump"):
        data = result.model_dump()
    elif isinstance(result, dict):
        data = result
    else:
        data = dict(result) if result else {}
    signed_url = data.get("signedUrl") or data.get("signed_url")
    if not signed_url:
        raise ValueError("Failed to create signed upload URL")
    return signed_url
