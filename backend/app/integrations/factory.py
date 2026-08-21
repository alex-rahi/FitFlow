"""Resolve auth/storage/queue/cache implementations from settings."""

from __future__ import annotations

from functools import lru_cache

from app.config import settings
from app.integrations.base import AuthProvider, CacheBackend, JobQueue, ObjectStorage
from app.integrations.supabase_adapters import SupabaseAuthAdapter, SupabaseStorageAdapter


@lru_cache
def get_auth_provider() -> AuthProvider:
    if settings.cloud_provider == "aws":
        from app.integrations.aws_adapters import CognitoAuthAdapter

        return CognitoAuthAdapter()
    return SupabaseAuthAdapter()


@lru_cache
def get_object_storage() -> ObjectStorage:
    if settings.cloud_provider == "aws":
        from app.integrations.aws_adapters import S3StorageAdapter

        return S3StorageAdapter()
    return SupabaseStorageAdapter()


@lru_cache
def get_job_queue() -> JobQueue | None:
    if settings.cloud_provider == "aws" and settings.sqs_queue_url:
        from app.integrations.aws_adapters import SQSJobQueue

        return SQSJobQueue()
    return None


@lru_cache
def get_cache() -> CacheBackend | None:
    if settings.cloud_provider == "aws" and settings.redis_url:
        from app.integrations.aws_adapters import RedisCache

        return RedisCache()
    return None
