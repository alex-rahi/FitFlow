# GymTok — Resume Bullets

**GymTok** — Social fitness video platform (MVP)  
*Personal project · 2025–2026*  
Live: https://gym-tok-demo-v3.vercel.app · GitHub: https://github.com/alex-rahi/GymTok_Demo_V3

**Stack:** React Native (Expo), TypeScript, FastAPI, PostgreSQL (Supabase), Next.js, Vercel, Render

- Shipped end-to-end **MVP on free-tier infra** (Vercel, Render, Supabase) — mobile web, REST API, Supabase auth, and Postgres with **$0/mo at launch**
- **Main Feed** — TikTok-style full-screen vertical scroll; default home tab aggregating all categories from followed creators
- **PRs** — Same immersive scroll UX tuned for personal-record and milestone lift content
- **Meal Prep** — 2-column **grid** layout for batch-cook and weekly prep content; tap-to-watch full video overlay
- **Nutrition** — Full-width **column** cards with macro breakdown (protein, carbs, fat, calories) and tap-through to meal breakdown videos
- **Advice** — **Community thread** layout: post as OP, nested replies, inline discussion, and “watch attached clip” for coaching/form-check videos
- Built upload flow with per-category tagging and **Next.js admin moderation queue** for manual video approval
- **Roadmap:** refactor to **AWS** (Cognito, RDS, S3, ECS/EKS) as user scale and cost justify migration off free-tier managed services
