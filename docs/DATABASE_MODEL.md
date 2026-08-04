# Database Model

## Social Domain

`profiles`, `posts`, `follows`, `likes`, `comments`, and `notifications`.

## Processing Domain

`processing_jobs`, `ai_detections`, `moderation_scores`, and `rule_evaluations`.

## Moderation and Operations

`moderation_decisions`, `review_queue`, and `audit_log`.

## Main Relationship Flow

```text
profiles
  └── posts
       ├── likes
       ├── comments
       ├── processing_jobs
       ├── ai_detections
       ├── moderation_scores
       ├── rule_evaluations
       ├── moderation_decisions
       └── review_queue
```

The source of truth is `supabase/migrations/001_initial_schema.sql`.
