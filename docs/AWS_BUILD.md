# GymTok AWS Build

Phase 2 started: provider interfaces + small-scale Terraform.

## What’s in this build

| Piece | Path |
|-------|------|
| Interfaces | `backend/app/integrations/base.py` |
| Supabase adapters | `backend/app/integrations/supabase_adapters.py` |
| AWS adapters | `backend/app/integrations/aws_adapters.py` (Cognito, S3, SQS, Redis) |
| Factory | `backend/app/integrations/factory.py` — `CLOUD_PROVIDER=supabase\|aws` |
| Config | `backend/app/config.py` — AWS env vars |
| Terraform (small) | `infrastructure/terraform/environments/small/` |

Default remains **Supabase**. Set `CLOUD_PROVIDER=aws` after infra is applied.

## Small-scale stack (~$15–80/mo)

```
Users → EC2 t3.micro (FastAPI)
           ├── Cognito
           ├── RDS db.t3.micro
           ├── S3 (raw / processed / thumbs)
           └── SQS (moderation queue + DLQ)
```

## Apply Terraform

```bash
cd infrastructure/terraform/environments/small
cp terraform.tfvars.example terraform.tfvars
export TF_VAR_db_password='your-strong-password'
terraform init
terraform plan
terraform apply
```

Copy `env_snippet` output into backend `.env`, then:

```env
CLOUD_PROVIDER=aws
USE_PLACEHOLDERS=false
```

## Scale path

| Scale | Next |
|-------|------|
| **Small** | This folder — t3.micro + RDS + S3 + Cognito + SQS |
| **Medium** | Add ALB, Redis, more workers on SQS depth |
| **Large** | EKS + HPA + Multi-AZ + Terraform modules |

See `docs/MIGRATION_ASSESSMENT.md` for full phase plan.

## Not done yet (later phases)

- Wire FastAPI JWT dependency to `get_auth_provider()`
- Wire upload flow to `get_object_storage()` / SQS enqueue
- Mobile Amplify/Cognito client
- Alembic schema without `auth.users`
- Medium/large Terraform environments
