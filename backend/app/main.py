from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin, notifications, posts, profiles, social
from app.config import settings
from app.db.pool import close_pool, get_pool
from app.middleware.errors import register_exception_handlers
from app.middleware.logging import RequestLoggingMiddleware, setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    if not settings.use_placeholders:
        await get_pool()
    yield
    if not settings.use_placeholders:
        await close_pool()


app = FastAPI(
    title="GymTok API",
    description="Backend for GymTok — fitness social video platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

register_exception_handlers(app)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profiles.router, prefix="/api/v1")
app.include_router(posts.router, prefix="/api/v1")
app.include_router(social.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "gymtok-api",
        "placeholder_mode": settings.use_placeholders,
    }
