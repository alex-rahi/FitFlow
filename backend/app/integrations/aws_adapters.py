"""AWS adapters — Cognito JWKS, S3, SQS, Redis. Used when CLOUD_PROVIDER=aws."""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Any
from urllib.request import urlopen

from jose import JWTError, jwk, jwt

from app.config import settings
from app.integrations.base import (
    AuthProvider,
    AuthUser,
    CacheBackend,
    JobMessage,
    JobQueue,
    ObjectStorage,
    PresignedUpload,
)


class CognitoAuthAdapter(AuthProvider):
    """Validates Cognito access/ID tokens via JWKS."""

    async def verify_token(self, token: str) -> AuthUser:
        try:
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")
            jwks = _get_cognito_jwks()
            key_data = next((k for k in jwks["keys"] if k.get("kid") == kid), None)
            if not key_data:
                raise ValueError("Unknown signing key")
            key = jwk.construct(key_data)
            decode_kwargs: dict[str, Any] = {"algorithms": ["RS256"]}
            if settings.cognito_app_client_id:
                decode_kwargs["audience"] = settings.cognito_app_client_id
            payload = jwt.decode(token, key, **decode_kwargs)
        except (JWTError, ValueError, KeyError, StopIteration) as exc:
            raise ValueError("Invalid Cognito token") from exc

        sub = payload.get("sub")
        if not sub:
            raise ValueError("Token missing subject")
        return AuthUser(
            id=str(sub),
            email=payload.get("email"),
            email_verified=bool(payload.get("email_verified", False)),
            claims=payload,
        )


class S3StorageAdapter(ObjectStorage):
    def __init__(self) -> None:
        import boto3

        self._client = boto3.client(
            "s3",
            region_name=settings.aws_region,
            endpoint_url=settings.aws_endpoint_url or None,
        )
        self._bucket = settings.s3_bucket_raw

    async def create_upload_url(self, key: str, content_type: str | None = None) -> PresignedUpload:
        params: dict[str, Any] = {"Bucket": self._bucket, "Key": key}
        if content_type:
            params["ContentType"] = content_type
        url = self._client.generate_presigned_url("put_object", Params=params, ExpiresIn=3600)
        headers = {"Content-Type": content_type} if content_type else None
        return PresignedUpload(url=url, method="PUT", headers=headers)

    async def create_download_url(self, key: str, expires_in: int = 3600) -> str:
        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self._bucket, "Key": key},
            ExpiresIn=expires_in,
        )

    async def object_exists(self, key: str) -> bool:
        try:
            self._client.head_object(Bucket=self._bucket, Key=key)
            return True
        except Exception:
            return False


class SQSJobQueue(JobQueue):
    def __init__(self) -> None:
        import boto3

        self._client = boto3.client(
            "sqs",
            region_name=settings.aws_region,
            endpoint_url=settings.aws_endpoint_url or None,
        )
        self._queue_url = settings.sqs_queue_url

    async def enqueue(self, message: JobMessage) -> str:
        body = {
            "job_id": message.job_id,
            "post_id": message.post_id,
            "storage_path": message.storage_path,
            "payload": message.payload or {},
        }
        resp = self._client.send_message(QueueUrl=self._queue_url, MessageBody=json.dumps(body))
        return str(resp.get("MessageId", ""))

    async def receive(self, max_messages: int = 1, wait_seconds: int = 10) -> list[JobMessage]:
        resp = self._client.receive_message(
            QueueUrl=self._queue_url,
            MaxNumberOfMessages=max_messages,
            WaitTimeSeconds=wait_seconds,
            MessageAttributeNames=["All"],
        )
        out: list[JobMessage] = []
        for raw in resp.get("Messages", []):
            body = json.loads(raw["Body"])
            out.append(
                JobMessage(
                    job_id=body["job_id"],
                    post_id=body["post_id"],
                    storage_path=body["storage_path"],
                    payload={**(body.get("payload") or {}), "receipt_handle": raw["ReceiptHandle"]},
                )
            )
        return out

    async def ack(self, receipt_handle: str) -> None:
        self._client.delete_message(QueueUrl=self._queue_url, ReceiptHandle=receipt_handle)


class RedisCache(CacheBackend):
    def __init__(self) -> None:
        import redis

        self._client = redis.Redis.from_url(settings.redis_url, decode_responses=True)

    async def get(self, key: str) -> str | None:
        value = self._client.get(key)
        return str(value) if value is not None else None

    async def set(self, key: str, value: str, ttl_seconds: int | None = None) -> None:
        if ttl_seconds:
            self._client.setex(key, ttl_seconds, value)
        else:
            self._client.set(key, value)

    async def delete(self, key: str) -> None:
        self._client.delete(key)


@lru_cache
def _get_cognito_jwks() -> dict[str, Any]:
    if not settings.cognito_jwks_url:
        raise ValueError("COGNITO_JWKS_URL is not configured")
    with urlopen(settings.cognito_jwks_url, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))
