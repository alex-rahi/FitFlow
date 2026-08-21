"""External service integrations (Supabase today, AWS adapters for migration)."""

from app.integrations.factory import (
    get_auth_provider,
    get_cache,
    get_job_queue,
    get_object_storage,
)

__all__ = [
    "get_auth_provider",
    "get_object_storage",
    "get_job_queue",
    "get_cache",
]
