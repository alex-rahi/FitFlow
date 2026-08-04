# GymTok AWS Migration — Phase 1 Assessment

**Date:** August 2026  
**Scope:** Supabase → AWS (Cognito, RDS, S3, SQS, ElastiCache, EKS, Terraform, CI/CD)  
**Status:** Assessment complete — no application code changed in this phase.

---

## 1. Executive Summary

GymTok is a monorepo with a working **placeholder/demo mode** (`USE_PLACEHOLDERS=true`). The product surface (mobile UX, API routes, admin moderation UI, YOLO rules engine) is largely built, but **Supabase integration is partial**:

| Layer | Current state | AWS target |
|-------|---------------|------------|
| Auth | Mobile uses `@supabase/supabase-js`; backend validates HS256 JWT with `SUPABASE_JWT_SECRET` | Amazon Cognito + JWKS |
| Database | Direct `asyncpg` SQL (no Supabase SDK on backend) | Amazon RDS PostgreSQL + SQLAlchemy + Alembic |
| Storage | Static Supabase Storage URL strings (not presigned) | Private S3 + presigned PUT + CloudFront OAC |
| Queue | DB polling (`processing_jobs`, `SKIP LOCKED`) | Amazon SQS + DLQ |
| Cache | None | Amazon ElastiCache (Redis) |
| Push/email | DB notifications only | SNS abstraction |
| Deploy | Docker Compose + generic K8s manifests | EKS + Terraform + GitHub Actions OIDC |

**Key insight:** Most backend business logic can be preserved. The refactor should introduce **interfaces** (auth, storage, queue, cache) and swap implementations — not rewrite feed/social/moderation rules.

---

## 2. Current Repository Structure

```
GymTok/
├── apps/
│   ├── mobile/              # Expo 57, Expo Router, 16 screens
│   └── admin/               # Next.js 16 moderation dashboard
├── backend/                 # FastAPI — 5 API routers, 5 services
├── workers/                 # Python moderation worker (YOLO + rules)
├── supabase/
│   ├── migrations/          # 001 schema, 002 seed
│   └── config.toml
├── k8s/                     # 8 manifests (no Terraform)
├── infra/                   # cdn-config.example.yaml only
├── docs/ARCHITECTURE.md
├── docker-compose.yml
└── .env.example
```

### Gap vs target structure

| Target path | Current | Action |
|-------------|---------|--------|
| `apps/api/` | `backend/` | Rename/move in Phase 2 |
| `apps/admin-dashboard/` | `apps/admin/` | Rename in Phase 2 |
| `apps/moderation-worker/` | `workers/` | Rename in Phase 2 |
| `packages/shared-*` | — | Create in Phase 2 |
| `infrastructure/terraform/` | — | Create in Phase 8 |
| `infrastructure/kubernetes/` | `k8s/` | Reorganize in Phase 7 |
| `.github/workflows/` | — | Create in Phase 9 |
| `tests/` | — | Create in Phase 10 |

---

## 3. Supabase Dependency Inventory

### 3.1 Mobile (active coupling — **HIGH**)

| File | Dependency |
|------|------------|
| `apps/mobile/package.json` | `@supabase/supabase-js` |
| `apps/mobile/src/lib/supabase.ts` | `createClient`, SecureStore adapter |
| `apps/mobile/src/context/AuthContext.tsx` | signUp, signIn, signOut, resetPassword, resend |
| `apps/mobile/src/lib/api.ts` | `supabase.auth.getSession()` for Bearer token |
| `apps/mobile/src/constants/theme.ts` | `EXPO_PUBLIC_SUPABASE_*` |
| `apps/mobile/.env` | Supabase URL + anon key |

### 3.2 Backend (config-only — **MEDIUM**)

| File | Dependency |
|------|------------|
| `backend/requirements.txt` | `supabase==2.11.0` (**never imported — remove**) |
| `backend/app/config.py` | 4 Supabase settings |
| `backend/app/auth/jwt.py` | HS256 + `supabase_jwt_secret`, audience `authenticated` |
| `backend/app/services/post_service.py` | Supabase Storage URL construction |

### 3.3 Worker (config-only — **LOW**)

| File | Dependency |
|------|------------|
| `workers/app/config.py` | `supabase_url`, `supabase_service_role_key` (unused in pipeline) |

### 3.4 Schema / infra ( **HIGH** )

| File | Issue |
|------|-------|
| `supabase/migrations/001_initial_schema.sql` | `profiles.id REFERENCES auth.users(id)`, RLS via `auth.uid()`, trigger on `auth.users` |
| `k8s/secrets.example.yaml` | Supabase secret keys |
| `infra/cdn-config.example.yaml` | Supabase origin domain |
| `docker-compose.yml` | Plain Postgres — **cannot apply 001 as-is** (no `auth` schema) |

### 3.5 Admin ( **NONE** )

No Supabase SDK. Uses `X-Admin-Secret` + REST to FastAPI.

---

## 4. Authentication Assessment

### Mobile flows to preserve

- Email/password registration
- Login / logout
- Password reset (`gymtok://reset-password` deep link)
- Email verification resend
- Secure token storage (SecureStore)

### Backend auth

```python
# backend/app/auth/jwt.py
# - HTTPBearer
# - python-jose HS256 decode
# - audience="authenticated"
# - Placeholder token bypass when USE_PLACEHOLDERS=true
```

### Cognito mapping

| Supabase concept | Cognito equivalent |
|------------------|-------------------|
| `auth.users` | Cognito User Pool |
| JWT `sub` | Cognito `sub` (UUID) |
| `user_metadata.username` | Custom attribute or post-signup profile API |
| Email verification | Cognito `email_verified` |
| Password reset | Cognito forgot-password flow |
| Admin/moderator | Cognito Groups: `user`, `moderator`, `admin` |

### New backend auth module (Phase 3)

```
backend/app/auth/
├── cognito.py          # JWKS fetch + cache, RS256 verify
├── dependencies.py     # get_current_user → AuthenticatedUser
├── models.py           # AuthenticatedUser, Role enum
└── jwt.py              # DEPRECATE or wrap for dev-only
```

**Mobile:** Replace `@supabase/supabase-js` with `amazon-cognito-identity-js` or AWS Amplify Auth v6 (no AWS credentials in app — only User Pool ID + Client ID).

---

## 5. Database Assessment

### Current access pattern

- **Library:** `asyncpg` connection pool (`backend/app/db/pool.py`)
- **Pattern:** Raw SQL in service modules (no ORM)
- **Migrations:** Supabase SQL files (not Alembic)

### Services using DB

| Service | File | Tables touched |
|---------|------|----------------|
| Profiles | `profile_service.py` | `profiles` |
| Posts | `post_service.py` | `posts`, `processing_jobs` |
| Social | `social_service.py` | `likes`, `comments`, `follows` |
| Admin | `admin_service.py` | `review_queue`, `moderation_decisions`, `audit_log`, `ai_detections`, `moderation_scores` |
| Notifications | `notification_service.py` | `notifications` |
| Worker | `processor.py` | All moderation + post status tables |

### Schema changes required for RDS

1. **Remove** `REFERENCES auth.users(id)` → standalone `users` table with Cognito `sub`
2. **Remove** RLS policies (enforce in FastAPI service layer)
3. **Remove** `handle_new_user()` trigger on `auth.users`
4. **Add** tables per target spec: `video_assets`, `reports`, `blocked_users`, soft-delete columns
5. **Rename** `posts` → `videos` (or alias — decide in Phase 3 to minimize API churn)
6. **Add** Alembic revision chain from clean baseline

### SQLAlchemy migration strategy

- Introduce SQLAlchemy 2.x models mirroring existing tables first
- Repository layer wraps queries currently in services
- Keep Pydantic schemas in `models/schemas.py` (already exist)
- asyncpg pool → SQLAlchemy async engine with connection pooling

**Complexity:** Medium (services) / High (schema + dual-write period)

---

## 6. Storage & Upload Assessment

### Current flow (preserved UX, replace internals)

```
POST /posts              → create post (status: uploading)
POST /posts/{id}/upload-url → returns non-presigned Supabase path
PUT  upload_url          → mobile uploads blob
POST /posts/{id}/confirm-upload → queue processing
```

### Target flow (per spec)

```
POST /api/v1/videos/upload-url
POST /api/v1/videos/{id}/upload-complete
GET  /api/v1/videos/{id}/status
```

**Recommendation:** Keep existing `/posts/*` routes as aliases during migration; add `/videos/*` as canonical in Phase 4.

### S3 key layout (target)

```
uploads/{user_id}/{video_id}/source.mp4
processed/{user_id}/{video_id}/output.mp4
thumbnails/{user_id}/{video_id}/thumbnail.jpg
```

### Worker gap

`workers/app/pipeline/processor.py` does **not** download from storage — runs mock pipeline when no local file. Phase 5 must add boto3 S3 get/put.

### CDN

`k8s/configmap.yaml` defines `CDN_BASE_URL` but **no code reads it**. Phase 6/7 wire CloudFront signed URLs or OAC public paths for approved media.

---

## 7. Worker & Moderation Assessment

### Current queue: PostgreSQL polling

```sql
UPDATE processing_jobs SET status = 'running'
WHERE id = (SELECT id FROM processing_jobs WHERE status = 'queued' ... FOR UPDATE SKIP LOCKED)
```

### Target queue: SQS

- API publishes message on upload-complete
- Worker long-polls SQS
- Delete on success; DLQ after N retries
- Idempotency via `video_id` + job status checks

### Pipeline components (keep)

| Module | Status | Notes |
|--------|--------|-------|
| `frame_extractor.py` | Working | OpenCV + FFmpeg |
| `yolo_detector.py` | Working + mock fallback | Ultralytics |
| `moderation.py` | Mock scores | Replace with Rekognition optional |
| `rules/engine.py` | Working | 5 rules, outcome priority |
| `rules/config.yaml` | **Not loaded** | Wire in Phase 5 |

### Status mapping

| Current (`post_status`) | Target |
|---------------------------|--------|
| `uploading` | `pending_upload` |
| `processing` | `processing` / `queued` |
| `pending_review` | `flagged` |
| `published` | `approved` |
| `rejected` | `rejected` |
| — | `failed` |

---

## 8. API Endpoint Inventory

All routes under `/api/v1` unless noted.

| Method | Path | Auth | Migration impact |
|--------|------|------|------------------|
| GET | `/health` | None | Split → `/health/live`, `/health/ready` |
| GET/PATCH | `/profiles/me` | JWT | Token source change only |
| GET | `/profiles/search` | None | — |
| GET | `/profiles/{id}` | None | — |
| POST | `/posts` | JWT | → videos table |
| GET | `/posts/feed` | Optional JWT | Add Redis cache |
| GET | `/posts/{id}` | None | CloudFront URLs |
| GET | `/posts/user/{id}` | None | — |
| POST | `/posts/{id}/upload-url` | JWT | **S3 presigned** |
| POST | `/posts/{id}/confirm-upload` | JWT | **SQS publish** |
| POST/DELETE | `/posts/{id}/like` | JWT | — |
| GET/POST | `/posts/{id}/comments` | JWT/None | — |
| POST/DELETE | `/users/{id}/follow` | JWT | — |
| GET/PATCH/POST | `/notifications/*` | JWT | SNS hook |
| GET/POST | `/admin/*` | Admin secret (+ JWT for review) | Cognito admin group |

---

## 9. Deployment Assessment

### Docker Compose (local dev — preserve)

Services: `db`, `backend`, `worker`, `admin`  
**Add in Phase 10:** Redis, LocalStack (S3/SQS), optional MinIO

### Kubernetes (existing — reorganize)

| Manifest | Reuse |
|----------|-------|
| `backend-deployment.yaml` | Adapt → `gymtok-api` + IRSA |
| `worker-deployment.yaml` | Split → background + moderation workers |
| `admin-deployment.yaml` | Adapt → `gymtok-admin-dashboard` |
| `ingress.yaml` | Replace with ALB Ingress Controller |
| `secrets.example.yaml` | Replace Supabase → Secrets Manager refs |

### Missing (to build)

- Terraform modules (VPC, EKS, RDS, S3, Cognito, SQS, Redis, CloudFront, WAF)
- GitHub Actions (lint, test, ECR push, EKS deploy)
- Kustomize overlays (dev/staging/production)
- ServiceAccounts + IRSA annotations

---

## 10. Tests

**Current:** None (no pytest, jest, or CI workflows).

**Phase 10 minimum:**

- Cognito JWT validation (mock JWKS)
- Presigned URL generation
- Upload complete + idempotency
- SQS publish/consume (LocalStack)
- Feed filtering (blocked users, moderation status)
- Redis cache hit/miss/fallback
- Health readiness checks

---

## 11. Environment Variables

### Remove (Supabase)

```
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### Add (AWS)

```
# Shared
AWS_REGION
ENVIRONMENT

# Cognito
COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID
COGNITO_JWKS_URL                    # or derived from region + pool id

# Mobile (public, safe)
EXPO_PUBLIC_COGNITO_USER_POOL_ID
EXPO_PUBLIC_COGNITO_CLIENT_ID
EXPO_PUBLIC_AWS_REGION

# S3
S3_BUCKET_UPLOADS
S3_BUCKET_PROCESSED
S3_BUCKET_THUMBNAILS

# SQS
SQS_MODERATION_QUEUE_URL
SQS_MODERATION_DLQ_URL

# Redis
REDIS_URL

# SNS
SNS_NOTIFICATIONS_TOPIC_ARN

# CloudFront
CLOUDFRONT_DOMAIN

# Secrets Manager (paths, not values)
SECRETS_MANAGER_DB_SECRET_ARN
```

---

## 12. Phase-by-Phase Migration Plan

### Phase 2: Application abstraction
- Create `packages/shared-models`, `shared-config`
- Define interfaces: `AuthProvider`, `ObjectStorage`, `JobQueue`, `CacheBackend`
- Adapter pattern: `SupabaseAuthAdapter` (temp), `CognitoAuthAdapter`, `S3Storage`, `SQSQueue`, `RedisCache`
- **Files:** new `backend/app/integrations/`, minimal changes to services

### Phase 3: PostgreSQL + Cognito
- Alembic init + baseline migration (decoupled schema)
- SQLAlchemy models + repositories
- Cognito JWKS auth dependency
- Mobile Amplify/Cognito auth
- User provisioning endpoint: `POST /api/v1/auth/sync-profile`
- **Files:** ~15 backend, ~5 mobile, new `alembic/`

### Phase 4: S3 upload flow
- boto3 presigned PUT/GET
- Upload validation (MIME, size, extension)
- S3 head-object verification on complete
- SQS message on complete
- **Files:** `post_service.py`, new `storage/s3.py`, mobile `upload.tsx`

### Phase 5: Moderation worker
- SQS consumer (long poll, DLQ, idempotent)
- S3 download → process → S3 upload processed/thumbnail
- Status transitions in PostgreSQL
- **Files:** `workers/app/` restructure, new `queue/sqs.py`

### Phase 6: Redis + feed
- Feed cache keys, TTL, invalidation
- Rate limiting middleware
- Graceful Redis fallback
- **Files:** new `cache/redis.py`, `feed_service.py`

### Phase 7: Containers + Kubernetes
- Multi-stage Dockerfiles (non-root)
- Kustomize base + overlays
- IRSA ServiceAccounts
- HPA, PDB, probes, NetworkPolicy
- **Files:** `infrastructure/kubernetes/`, updated Dockerfiles

### Phase 8: Terraform
- Modules: networking, eks, rds, s3, cognito, sqs, redis, cloudfront, waf, iam, monitoring
- Environments: dev, staging, production
- **Files:** `infrastructure/terraform/**`

### Phase 9: CI/CD + observability
- GitHub Actions: PR checks, main → ECR → EKS dev, prod with approval
- OIDC IAM role (no long-lived keys)
- Structured JSON logging, CloudWatch alarms
- **Files:** `.github/workflows/`, middleware updates

### Phase 10: Validation + docs
- Test suite, `Architecture.md`, `Deployment_Guide.md`, `API_Documentation.md`
- Terraform/k8s validation in CI

---

## 13. Files to Modify (by phase)

### Phase 2–3 (high touch)

| File | Change |
|------|--------|
| `apps/mobile/src/lib/supabase.ts` | Replace with Cognito client |
| `apps/mobile/src/context/AuthContext.tsx` | Cognito flows |
| `apps/mobile/src/lib/api.ts` | Token from Cognito session |
| `apps/mobile/src/constants/theme.ts` | Cognito env vars |
| `apps/mobile/package.json` | Remove supabase-js, add Amplify |
| `backend/app/auth/jwt.py` | JWKS validation |
| `backend/app/config.py` | AWS settings, pydantic validation |
| `backend/app/db/pool.py` | SQLAlchemy engine |
| `backend/app/services/*.py` | Repository injection |
| `backend/requirements.txt` | sqlalchemy, alembic, boto3, redis, remove supabase |
| `supabase/migrations/*` | Superseded by Alembic |
| `.env.example` | AWS vars |

### Phase 4–5

| File | Change |
|------|--------|
| `backend/app/services/post_service.py` | S3 presigned + SQS |
| `backend/app/api/posts.py` | Upload validation, status endpoint |
| `apps/mobile/app/(tabs)/upload.tsx` | S3 presigned PUT |
| `workers/app/main.py` | SQS consumer |
| `workers/app/pipeline/processor.py` | S3 I/O |
| `workers/requirements.txt` | boto3 |

### Phase 6–7

| File | Change |
|------|--------|
| New `backend/app/services/feed_service.py` | Redis cache |
| New `backend/app/cache/redis.py` | Cache backend |
| `k8s/*` | Move to `infrastructure/kubernetes/`, IRSA |
| `docker-compose.yml` | Redis, LocalStack |
| All Dockerfiles | Multi-stage, non-root |

### Phase 8–9

| File | Change |
|------|--------|
| New `infrastructure/terraform/**` | Full AWS stack |
| New `.github/workflows/**` | CI/CD |
| `backend/app/middleware/logging.py` | Structured JSON |

### Low / no change

| File | Reason |
|------|--------|
| `workers/app/rules/engine.py` | Pure business logic |
| `apps/admin/src/lib/api.ts` | Backend URL only |
| `apps/mobile/app/(tabs)/feed.tsx` | Uses api client |
| `design/*` | Unchanged |

---

## 14. Risk Register

| Risk | Mitigation |
|------|------------|
| Schema migration breaks prod data | Alembic from clean baseline; staging rehearsal |
| Cognito deep links differ from Supabase | Test iOS/Android redirect URIs early |
| YOLO image size on EKS | Separate moderation worker image; GPU node group later |
| Redis unavailable | Feed falls back to PostgreSQL (required) |
| SQS duplicate messages | Idempotent job processing by `video_id` |
| Cost overrun | Start with single-AZ dev; HPA min replicas = 1 |

---

## 15. Estimated AWS Cost Drivers

| Service | Driver |
|---------|--------|
| EKS | Control plane (~$73/mo) + worker EC2 |
| RDS PostgreSQL | Instance size + storage + Multi-AZ in prod |
| ElastiCache Redis | Node type + replicas |
| S3 | Storage + PUT/GET + lifecycle to IA/Glacier |
| CloudFront | Egress for video delivery |
| SQS | Requests (low unless high volume) |
| NAT Gateway | **High** — use VPC endpoints for S3, ECR, SQS, Secrets Manager |
| Cognito | MAU pricing tier |

---

## 16. Immediate Next Steps (Phase 2)

1. Create `docs/MIGRATION_ASSESSMENT.md` ✅ (this document)
2. Add `backend/app/integrations/` with interface definitions
3. Add `packages/shared-config` for typed settings
4. Rename directories per target structure (non-breaking aliases first)
5. Do **not** delete Supabase code until Cognito path is verified in dev

---

## 17. Local Startup (unchanged until Phase 10)

```bash
docker compose up --build
cd apps/mobile && npm install && npx expo start --web
cd apps/admin && npm run dev
```

Placeholder mode continues to work without AWS during Phases 2–6.
