import time
from uuid import UUID

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt

from app.config import settings

security = HTTPBearer()

PLACEHOLDER_USER_ID = UUID("00000000-0000-4000-8000-000000000001")
PLACEHOLDER_TOKEN = "placeholder-access-token"

_jwks_cache: dict | None = None
_jwks_cache_at: float = 0
JWKS_TTL_SECONDS = 3600


async def _fetch_jwks() -> dict:
    global _jwks_cache, _jwks_cache_at
    now = time.time()
    if _jwks_cache and now - _jwks_cache_at < JWKS_TTL_SECONDS:
        return _jwks_cache

    jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_at = now
        return _jwks_cache


def _signing_key_from_jwks(jwks: dict, kid: str | None):
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return jwk.construct(key)
    raise JWTError("Signing key not found in JWKS")


async def _decode_supabase_jwt(token: str) -> dict:
    header = jwt.get_unverified_header(token)
    algorithm = header.get("alg", "HS256")
    decode_kwargs = {
        "algorithms": [algorithm],
        "audience": "authenticated",
        "issuer": f"{settings.supabase_url.rstrip('/')}/auth/v1",
    }

    if algorithm == "HS256":
        return jwt.decode(token, settings.supabase_jwt_secret, **decode_kwargs)

    if algorithm in ("ES256", "RS256"):
        jwks = await _fetch_jwks()
        signing_key = _signing_key_from_jwks(jwks, header.get("kid"))
        return jwt.decode(token, signing_key, **decode_kwargs)

    raise JWTError(f"Unsupported JWT algorithm: {algorithm}")


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UUID:
    token = credentials.credentials

    if settings.use_placeholders and token == PLACEHOLDER_TOKEN:
        return PLACEHOLDER_USER_ID

    try:
        payload = await _decode_supabase_jwt(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
        return UUID(user_id)
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")


async def get_optional_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        HTTPBearer(auto_error=False)
    ),
) -> UUID | None:
    if credentials is None:
        return None
    try:
        return await get_current_user_id(credentials)
    except HTTPException:
        return None
