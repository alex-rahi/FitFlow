# Deployment Guide

## Local

```bash
docker compose up --build
```

## Environment

Copy `.env.example` to `.env`. Keep placeholder mode enabled for the interview demo. Production values belong in a managed secret store.

## Database

Apply the Supabase migrations and create the documented media buckets: `raw-uploads`, `processed-videos`, and `thumbnails`.

## Kubernetes

Apply namespace, config, secrets, backend, worker, admin, and ingress manifests from `k8s/`.

## Production Work

Add image scanning, managed secrets, health probes, resource tuning, autoscaling, connection pooling, centralized telemetry, backups, disaster recovery, staged deployment, and rollback controls.
