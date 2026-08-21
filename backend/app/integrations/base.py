"""Provider interfaces for swapping Supabase → AWS without rewriting business logic."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class AuthUser:
    id: str
    email: str | None = None
    email_verified: bool = False
    claims: dict[str, Any] | None = None


@dataclass
class PresignedUpload:
    url: str
    method: str = "PUT"
    headers: dict[str, str] | None = None
    expires_in: int = 3600


@dataclass
class JobMessage:
    job_id: str
    post_id: str
    storage_path: str
    payload: dict[str, Any] | None = None


class AuthProvider(ABC):
    @abstractmethod
    async def verify_token(self, token: str) -> AuthUser:
        """Validate a bearer JWT and return the authenticated user."""


class ObjectStorage(ABC):
    @abstractmethod
    async def create_upload_url(self, key: str, content_type: str | None = None) -> PresignedUpload:
        """Return a short-lived URL for direct client upload."""

    @abstractmethod
    async def create_download_url(self, key: str, expires_in: int = 3600) -> str:
        """Return a short-lived URL for reading an object."""

    @abstractmethod
    async def object_exists(self, key: str) -> bool:
        """True if the object is present in storage."""


class JobQueue(ABC):
    @abstractmethod
    async def enqueue(self, message: JobMessage) -> str:
        """Publish a moderation/processing job. Returns provider message id."""

    @abstractmethod
    async def receive(self, max_messages: int = 1, wait_seconds: int = 10) -> list[JobMessage]:
        """Long-poll for jobs (workers)."""

    @abstractmethod
    async def ack(self, receipt_handle: str) -> None:
        """Delete/acknowledge a processed message."""


class CacheBackend(ABC):
    @abstractmethod
    async def get(self, key: str) -> str | None:
        ...

    @abstractmethod
    async def set(self, key: str, value: str, ttl_seconds: int | None = None) -> None:
        ...

    @abstractmethod
    async def delete(self, key: str) -> None:
        ...
