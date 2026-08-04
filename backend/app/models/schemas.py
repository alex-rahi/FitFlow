from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class PostStatus(str, Enum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    AGE_RESTRICTED = "age_restricted"
    FLAGGED = "flagged"
    PUBLISHED = "published"


class RuleOutcome(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    AGE_RESTRICT = "age_restrict"
    FLAG_FOR_REVIEW = "flag_for_review"
    MANUAL_REVIEW = "manual_review"
    PUBLISH = "publish"


# --- Auth ---

class UserProfile(BaseModel):
    id: UUID
    username: str
    display_name: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    trust_level: int = 0
    follower_count: int = 0
    following_count: int = 0
    post_count: int = 0
    created_at: datetime | None = None


class ProfileUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None


# --- Posts ---

class PostCreate(BaseModel):
    caption: str | None = None


class PostResponse(BaseModel):
    id: UUID
    user_id: UUID
    caption: str | None = None
    raw_video_url: str | None = None
    processed_video_url: str | None = None
    thumbnail_url: str | None = None
    duration_seconds: float | None = None
    status: PostStatus
    moderation_decision: str | None = None
    like_count: int = 0
    comment_count: int = 0
    view_count: int = 0
    created_at: datetime
    author: UserProfile | None = None


class UploadUrlResponse(BaseModel):
    post_id: UUID
    upload_url: str
    storage_path: str


# --- Social ---

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)


class CommentResponse(BaseModel):
    id: UUID
    user_id: UUID
    post_id: UUID
    content: str
    created_at: datetime
    author: UserProfile | None = None


class FollowResponse(BaseModel):
    follower_id: UUID
    following_id: UUID
    created_at: datetime


# --- Feed ---

class FeedResponse(BaseModel):
    posts: list[PostResponse]
    next_cursor: str | None = None


# --- Admin / Moderation ---

class ReviewItem(BaseModel):
    id: UUID
    post_id: UUID
    priority: int
    review_status: str
    post: PostResponse | None = None
    detections: list[dict] = []
    moderation_scores: list[dict] = []
    created_at: datetime


class ReviewAction(BaseModel):
    action: RuleOutcome
    notes: str | None = None


class ModerationStats(BaseModel):
    total_posts: int
    pending_review: int
    approved: int
    rejected: int
    flagged: int
    avg_processing_time_seconds: float | None = None


# --- Notifications ---

class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    title: str
    body: str | None = None
    data: dict | None = None
    read: bool = False
    created_at: datetime
