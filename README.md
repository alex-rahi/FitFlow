# GymTok

**TikTok-style social fitness app** — vertical video feed, category lanes, uploads, AI-assisted moderation.

**Live demo:** https://gym-tok-demo-v3.vercel.app

---

## Architecture

```mermaid
flowchart TB
    subgraph users [Users]
        Mobile["Expo Web / React Native"]
    end

    subgraph edge [Edge]
        Vercel["Vercel — mobile"]
        Render["Render — FastAPI API"]
    end

    subgraph supabase [Supabase]
        Auth["Auth JWT"]
        PG["PostgreSQL"]
        Storage["Storage"]
    end

    subgraph ops [Operations]
        Admin["Next.js Admin"]
        Worker["YOLO Worker"]
    end

    Mobile -->|login| Auth
    Mobile -->|API| Render
    Mobile -->|upload| Storage
    Render --> PG
    Render --> Storage
    Admin --> Render
    Worker -.-> PG
    Vercel --> Mobile
```

**Scale path:** Supabase MVP → EC2 t3.micro → RDS + S3 + CloudFront → SQS workers → EKS

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native, Expo, TypeScript |
| Backend | FastAPI, Python, Pydantic |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase JWT |
| Storage | Supabase Storage → S3 |
| AI | YOLOv8, OpenCV, rules engine |
| Admin | Next.js, Tailwind |
| Deploy | Vercel, Render, Docker, Kubernetes |

---

## Screenshots

<table>
  <tr>
    <td align="center"><b>Workouts lane</b><br><img src="screenshots/feed_workouts.png" alt="Workouts feed" width="240"></td>
    <td align="center"><b>For You feed</b><br><img src="screenshots/feed_for_you.png" alt="For You feed" width="240"></td>
    <td align="center"><b>Upload</b><br><img src="screenshots/upload.png" alt="Upload screen" width="240"></td>
  </tr>
</table>

<p align="center"><i>← → category swipe · ↑ ↓ video scroll · video, photo, or thread uploads</i></p>
