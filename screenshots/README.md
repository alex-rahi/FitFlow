# GymTok — App Screenshots

Complete UI capture for interview walkthroughs.

**Live demo:** https://gym-tok-demo-v3.vercel.app

---

## Mobile app (`mobile/`)

### Auth flow

| Screen | File |
|--------|------|
| Splash | [00_splash.png](mobile/00_splash.png) |
| Welcome | [05_welcome.png](mobile/05_welcome.png) |
| Login | [06_login.png](mobile/06_login.png) |
| Sign up | [07_signup.png](mobile/07_signup.png) |
| Forgot password | [08_forgot_password.png](mobile/08_forgot_password.png) |
| Verify email | [09_verify_email.png](mobile/09_verify_email.png) |

### Main tabs

| Screen | File |
|--------|------|
| Feed (For You) | [10_feed.png](mobile/10_feed.png) |
| Feed (catalog design) | [10_feed_catalog.png](mobile/10_feed_catalog.png) |
| Feed (live production) | [10_feed_live.png](mobile/10_feed_live.png) |
| Upload | [11_upload.png](mobile/11_upload.png) |
| Profile | [12_profile.png](mobile/12_profile.png) |

### Settings & secondary screens

| Screen | File |
|--------|------|
| Settings | [13_settings.png](mobile/13_settings.png) |
| Edit profile | [14_edit_profile.png](mobile/14_edit_profile.png) |
| Search | [15_search.png](mobile/15_search.png) |
| Community (Advice) | [16_community.png](mobile/16_community.png) |
| Recipes / Meal prep | [17_recipes.png](mobile/17_recipes.png) |
| Notifications | [18_notifications.png](mobile/18_notifications.png) |

---

## Admin dashboard (`admin/`)

| Screen | File |
|--------|------|
| Dashboard (stats) | [01_dashboard.png](admin/01_dashboard.png) |
| Review queue | [02_review_queue.png](admin/02_review_queue.png) |
| Audit log | [03_audit_log.png](admin/03_audit_log.png) |

---

## Regenerate

```bash
# Mobile web export + capture
cd apps/mobile && npm install && npx expo export -p web
cd ../.. && npx serve apps/mobile/dist -l 4173   # separate terminal
node scripts/capture-screenshots.js

# Admin capture
cd apps/admin && NEXT_PUBLIC_USE_PLACEHOLDERS=true npm run build
NEXT_PUBLIC_USE_PLACEHOLDERS=true npx next start -p 3001   # separate terminal
ADMIN_BASE=http://127.0.0.1:3001 node scripts/capture-screenshots.js
```

Requires `playwright` (installed at repo root for capture scripts).
