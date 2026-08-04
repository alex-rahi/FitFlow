# GymTok Interview One-Pager

## Elevator Pitch

GymTok is a full-stack social fitness MVP modeled around a short-form vertical video experience. It combines a React Native and Expo mobile client, FastAPI REST API, Supabase-oriented data layer, a background AI processing pipeline, and a Next.js moderation dashboard.

## Engineering Problem

A video platform must handle authentication, uploads, social interactions, feed delivery, asynchronous processing, policy decisions, review workflows, and production scaling.

## Solution

The mobile client sends authenticated requests to FastAPI. Uploaded media is designed to go directly to object storage through a temporary URL. A worker reads processing jobs, extracts frames, runs object detection and moderation, applies configurable rules, and writes a decision. Approved media becomes eligible for the feed; uncertain content enters manual review.

## Strongest Technical Points

- Independently deployable mobile, API, worker, and admin components
- PostgreSQL schema for social and moderation workflows
- Direct-to-storage upload design
- Asynchronous AI-processing boundary
- Policy rules separated from model inference
- Audit and review data model
- Docker and Kubernetes deployment assets
- Placeholder mode for a reliable interview demonstration

## Honest Status

The user interfaces and service structure are implemented as an MVP, with placeholder data available for demonstration. Live Supabase credentials, production storage, deployed infrastructure, and validated model performance are not included.
