# Design Document

## Goal

Provide a short-form fitness video experience with social interactions and an AI-assisted moderation workflow suitable for an interview demonstration.

## Users

- Fitness viewers
- Video creators
- Content moderators
- Platform operators

## Functional Scope

### Mobile
Welcome, signup, login, verification, password reset, vertical feed, search, follow, upload, notifications, profile, and settings.

### Backend
Profile management, posts and feed, upload coordination, likes, comments, follows, notifications, administrative review, and analytics.

### Worker
Processing-job polling, frame extraction, YOLO detection, moderation scoring, rules-engine evaluation, and decision persistence.

### Admin
Statistics, review queue, audit log, system health, and processing visibility.

## Design Decisions

- **FastAPI:** keeps the API close to the Python AI ecosystem and provides validation and OpenAPI documentation.
- **Direct-to-storage upload:** avoids sending large video files through API replicas.
- **Separate worker:** isolates long-running analysis from interactive requests.
- **Configurable rules:** keeps product policy separate from model inference.
- **Placeholder mode:** enables a stable demonstration without cloud credentials.

## Out of Scope

Production moderation certification, recommendation-model training, formal compliance, production high availability, and App Store release.
