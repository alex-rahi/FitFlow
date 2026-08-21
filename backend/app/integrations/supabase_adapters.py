"""Supabase adapters — current production path until Cognito/S3 cutover."""

from __future__ import annotations

from jose import JWTError, jwt

from app.auth.jwt import PLACEHOLDER_TOKEN, PLACEHOLDER_USER_ID
from app.config import settings
from app.integrations.base import AuthProvider, AuthUser, ObjectStorage, PresignedUpload
from app.integrations.storage import create_signed_upload_url


class SupabaseAuthAdapter(AuthProvider):
    async def verify_token(self, token: str) -> AuthUser:
        if settings.use_placeholders and token == PLACEHOLDER_TOKEN:
            return AuthUser(
                id=str(PLACEHOLDER_USER_ID),
                email="demo@gymtok.com",
                email_verified=True,
            )

        try:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except JWTError as exc:
            raise ValueError("Invalid token") from exc

        sub = payload.get("sub")
        if not sub:
            raise ValueError("Token missing subject")
        return AuthUser(
            id=str(sub),
            email=payload.get("email"),
            email_verified=bool(payload.get("email_verified", False)),
            claims=payload,
        )


class SupabaseStorageAdapter(ObjectStorage):
    async def create_upload_url(self, key: str, content_type: str | None = None) -> PresignedUpload:
        url = create_signed_upload_url(key)
        headers = {"Content-Type": content_type} if content_type else None
        return PresignedUpload(url=url, method="PUT", headers=headers)

    async def create_download_url(self, key: str, expires_in: int = 3600) -> str:
        base = settings.supabase_url.rstrip("/")
        bucket = settings.storage_bucket_raw
        return f"{base}/storage/v1/object/public/{bucket}/{key}"

    async def object_exists(self, key: str) -> bool:
        return True
