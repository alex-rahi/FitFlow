"""Save uploaded media to a shared local directory for the YOLO worker."""

import os
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile

from app.config import settings


def ensure_uploads_dir() -> Path:
    root = Path(settings.uploads_dir)
    root.mkdir(parents=True, exist_ok=True)
    return root


async def save_upload_file(post_id: UUID, storage_path: str, file: UploadFile) -> str:
    root = ensure_uploads_dir()
    dest = root / storage_path
    dest.parent.mkdir(parents=True, exist_ok=True)

    data = await file.read()
    dest.write_bytes(data)
    return str(dest)


def resolve_upload_path(storage_path: str) -> str:
    return str(Path(settings.uploads_dir) / storage_path)


def upload_exists(storage_path: str) -> bool:
    return os.path.isfile(resolve_upload_path(storage_path))
