"""Call the YOLO worker HTTP API."""

import logging

import httpx

from app.config import settings
from app.services.local_storage import resolve_upload_path, upload_exists

logger = logging.getLogger("gymtok.api")


async def analyze_storage_path(storage_path: str) -> dict:
    if not upload_exists(storage_path):
        raise FileNotFoundError(f"Upload not found: {storage_path}")

    url = f"{settings.worker_url.rstrip('/')}/analyze-path"
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, params={"storage_path": storage_path})
        response.raise_for_status()
        return response.json()


async def analyze_upload_bytes(filename: str, data: bytes) -> dict:
    url = f"{settings.worker_url.rstrip('/')}/analyze"
    files = {"file": (filename, data)}
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, files=files)
        response.raise_for_status()
        return response.json()


async def worker_health() -> dict:
    url = f"{settings.worker_url.rstrip('/')}/health"
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()
