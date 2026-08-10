from functools import lru_cache

from supabase import Client, create_client

from app.config import settings


@lru_cache
def get_supabase_admin() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def create_signed_upload_url(storage_path: str) -> str:
    bucket = settings.storage_bucket_raw
    result = get_supabase_admin().storage.from_(bucket).create_signed_upload_url(storage_path)
    signed_url = result.get("signedUrl") or result.get("signed_url")
    if not signed_url:
        raise ValueError("Failed to create signed upload URL")
    return signed_url
