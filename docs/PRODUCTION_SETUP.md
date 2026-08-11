# Production Setup — GymTok_Demo_V3

Step-by-step guide to connect the live app to your existing Supabase project (**GymTok_Demo_V3**).

## Verified baseline (your project)

These checks passed in Supabase SQL Editor:

| Check | Value | Status |
|-------|-------|--------|
| GymTok tables | 10 | OK |
| Storage buckets | 3 (`raw-uploads`, `processed-videos`, `thumbnails`) | OK |
| Auth users / profiles | 1 / 1 | OK |
| Posts | 6 | OK |
| Pending reviews | 0 | OK |

Migrations `001`–`006` in `supabase/migrations/` are applied. No further SQL is required unless you add new features.

---

## Architecture (production)

```
Mobile (Vercel)          Backend API (Render)         Supabase
─────────────────        ────────────────────         ────────
Expo web build    ──►    FastAPI :8000         ──►    Postgres + Auth + Storage
Supabase Auth direct ─────────────────────────────►    (profiles, posts, buckets)

Admin (local or Vercel) ──► Backend API ──► Supabase
Worker (optional)       ──► YOLO + rules  ──► Supabase / Storage
```

- **Mobile** talks to Supabase for auth and to the **backend** for posts, feed, moderation.
- **Admin** review queue reads the backend (`/api/v1/admin/...`), not Supabase directly.
- **Worker** is optional on free tier; moderation can run via backend + rules without a separate GPU host.

---

## 1. Supabase dashboard

Project: **GymTok_Demo_V3** → **Settings**

### API keys

Copy from **Settings → API**:

| Variable | Where in Supabase | Used by |
|----------|-------------------|---------|
| Project URL | `https://xxxx.supabase.co` | Mobile, backend |
| Publishable (anon) key | API Keys → publishable | Mobile (`EXPO_PUBLIC_*`) |
| Secret (service role) key | API Keys → secret | Backend only (never mobile) |
| JWT secret | Legacy JWT secret (HS256) | Backend token verification |

Supabase’s newer `sb_publishable_...` / `sb_secret_...` keys work the same as anon/service role for this app.

### Database URL

**Settings → Database → Connection string → URI** (Transaction pooler recommended for Render):

```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

Use the **pooler** URL on Render free tier (limited connections).

### Auth redirect URLs

**Authentication → URL configuration**:

| Setting | Value |
|---------|-------|
| Site URL | Your Vercel mobile URL, e.g. `https://gym-tok-demo-v3.vercel.app` |
| Redirect URLs | Same Vercel URL, `http://localhost:8081`, `gymtok://` |

### Storage

**Storage** should show `raw-uploads`, `processed-videos`, `thumbnails`. Already confirmed via SQL.

---

## 2. Backend on Render

Repo includes `render.yaml`. Connect **alex-rahi/GymTok_Demo_V3** on [render.com](https://render.com) and create the **gymtok-api** web service.

### Environment variables (Render dashboard)

Set these as **secret** env vars (do not commit):

| Key | Example / notes |
|-----|-----------------|
| `USE_PLACEHOLDERS` | `false` |
| `DATABASE_URL` | Supabase pooler URI |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key (uploads + admin storage) |
| `SUPABASE_JWT_SECRET` | Legacy JWT secret |
| `CORS_ORIGINS` | Comma-separated origins (see below) |
| `ADMIN_SECRET` | Long random string for admin API |

Optional (defaults are fine for MVP):

| Key | Default |
|-----|---------|
| `USE_LOCAL_YOLO` | `false` |
| `WORKER_URL` | unused if local YOLO off |

**CORS_ORIGINS** example:

```
https://gym-tok-demo-v3.vercel.app,http://localhost:8081,http://localhost:3000
```

Add your admin URL if you deploy admin to Vercel later.

### Deploy and verify

After deploy, open:

```
https://YOUR-SERVICE.onrender.com/health
https://YOUR-SERVICE.onrender.com/docs
```

Expect JSON health OK and OpenAPI docs. First request on free tier may take ~30s (cold start).

---

## 3. Mobile on Vercel

Project root for deploy: **`apps/mobile`**.

### Environment variables (Vercel → Settings → Environment Variables)

Set for **Production** (and Preview if you want):

| Key | Value |
|-----|-------|
| `EXPO_PUBLIC_USE_PLACEHOLDERS` | `false` |
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Publishable key |
| `EXPO_PUBLIC_API_URL` | `https://YOUR-SERVICE.onrender.com` |
| `EXPO_PUBLIC_USE_LOCAL_YOLO` | `false` |

Expo bakes `EXPO_PUBLIC_*` at **build time**. Redeploy after changing them.

`apps/mobile/vercel.json` runs `npx expo export -p web` without hardcoded placeholders so Vercel env vars apply.

### Redeploy

**Deployments → Redeploy** (or push to `main` if connected to Git).

### Verify mobile

1. Open the Vercel URL — no “placeholder mode” banner on login/signup.
2. Sign in with your Supabase user (the 1 auth user you have).
3. Feed should load real posts from the API (your 6 posts), not static placeholders.
4. Upload a photo/video — check **Storage** and **posts** table in Supabase.

---

## 4. Admin dashboard (local)

Admin is not required on Vercel for MVP. Run locally against production API:

```bash
cd apps/admin
```

Create `.env.local`:

```env
NEXT_PUBLIC_USE_PLACEHOLDERS=false
NEXT_PUBLIC_API_URL=https://YOUR-SERVICE.onrender.com
ADMIN_SECRET=same-as-render-ADMIN_SECRET
```

```bash
npm install && npm run dev
```

Open [http://localhost:3000/review](http://localhost:3000/review) for the moderation queue.

---

## 5. Local production testing (optional)

From repo root, copy env templates:

```bash
cp .env.example .env
cp apps/mobile/.env.example apps/mobile/.env
```

Fill with the same Supabase + Render values. Set `USE_PLACEHOLDERS=false` everywhere.

```bash
# Terminal 1 — backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — mobile
cd apps/mobile && npx expo start --web
```

---

## 6. Checklist

Use this before calling production “live”:

- [ ] Render `/health` returns OK
- [ ] Vercel build has `EXPO_PUBLIC_USE_PLACEHOLDERS=false`
- [ ] Login works with Supabase auth (not demo skip)
- [ ] Feed shows DB posts, not placeholder JSON
- [ ] Upload creates row in `posts` + file in `raw-uploads`
- [ ] Flagged content appears in admin review queue
- [ ] CORS allows your Vercel origin (no browser CORS errors in Network tab)

---

## 7. Demo vs production

| | Demo (current Vercel default) | Production |
|--|-------------------------------|------------|
| `USE_PLACEHOLDERS` | `true` | `false` |
| Supabase | Ignored | GymTok_Demo_V3 |
| Backend | Optional / local | Render |
| Auth | Mock / skip | Real Supabase |
| Analytics | Client-only (AsyncStorage) | Same (Phase 1) |

Keep a **separate Vercel project** or **preview branch** with `EXPO_PUBLIC_USE_PLACEHOLDERS=true` if you still need the interview demo without live services.

---

## 8. Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| “Placeholder mode” on mobile | Set `EXPO_PUBLIC_USE_PLACEHOLDERS=false` and redeploy |
| CORS error in browser | Add Vercel URL to Render `CORS_ORIGINS` |
| 401 on API | Check `SUPABASE_JWT_SECRET` matches Supabase legacy JWT |
| Upload fails | Confirm `SUPABASE_SERVICE_ROLE_KEY` on Render; check storage policies |
| Empty feed | Confirm `USE_PLACEHOLDERS=false` on backend; check `posts.status` |
| Render timeout on first hit | Free tier cold start; retry or upgrade plan |
| `auth_users` > `profiles` | Run profile backfill SQL (see `docs/DATABASE_MODEL.md`) |

---

## 9. What’s not in this MVP

- Dedicated YOLO worker host (use `USE_LOCAL_YOLO=true` locally only)
- Admin deployed to production URL
- Server-side analytics (PostHog / Supabase events) — client session analytics only
- Paid content-safety APIs (Sightengine, etc.)

See `docs/ROADMAP.md` for next phases.
