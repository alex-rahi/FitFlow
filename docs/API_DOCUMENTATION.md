# API Documentation

The backend registers versioned routers under `/api/v1`. Protected routes use `Authorization: Bearer <jwt>`.

## Profiles
- `GET /api/v1/profiles/me`
- `PATCH /api/v1/profiles/me`
- `GET /api/v1/profiles/search?q=<query>`
- `GET /api/v1/profiles/{profile_id}`

## Posts
- `POST /api/v1/posts`
- `GET /api/v1/posts/feed`
- `GET /api/v1/posts/{post_id}`
- `GET /api/v1/posts/user/{user_id}`
- `POST /api/v1/posts/{post_id}/upload-url`
- `POST /api/v1/posts/{post_id}/confirm-upload`

## Social
- `POST/DELETE /api/v1/social/posts/{post_id}/like`
- `GET/POST /api/v1/social/posts/{post_id}/comments`
- `POST/DELETE /api/v1/social/users/{target_id}/follow`

## Notifications
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/{notification_id}/read`
- `POST /api/v1/notifications/read-all`

## Administration
- `GET /api/v1/admin/review-queue`
- `POST /api/v1/admin/review/{review_id}`
- `GET /api/v1/admin/stats`
- `GET /api/v1/admin/audit-log`

## Health
- `GET /health`

Interactive OpenAPI documentation is exposed at `/docs` while FastAPI is running.
