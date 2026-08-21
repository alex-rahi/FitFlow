from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Cloud provider: "supabase" (default) or "aws"
    cloud_provider: str = "supabase"

    # Supabase (current MVP)
    supabase_url: str = "https://placeholder.supabase.co"
    supabase_anon_key: str = "placeholder-anon-key-replace-me"
    supabase_service_role_key: str = "placeholder-service-role-key-replace-me"
    supabase_jwt_secret: str = "placeholder-jwt-secret-for-local-dev-only"
    database_url: str = "postgresql://postgres:postgres@localhost:54322/postgres"
    cors_origins: str = "http://localhost:3000,http://localhost:8081"
    storage_bucket_raw: str = "raw-uploads"
    storage_bucket_processed: str = "processed-videos"
    storage_bucket_thumbnails: str = "thumbnails"
    admin_secret: str = "placeholder-admin-secret"
    use_placeholders: bool = True
    use_local_yolo: bool = False
    worker_url: str = "http://localhost:8001"
    uploads_dir: str = "data/uploads"

    # AWS (small → large scale migration)
    aws_region: str = "us-east-1"
    aws_endpoint_url: str = ""  # LocalStack: http://localhost:4566
    cognito_user_pool_id: str = ""
    cognito_app_client_id: str = ""
    cognito_jwks_url: str = ""
    s3_bucket_raw: str = "gymtok-raw-uploads"
    s3_bucket_processed: str = "gymtok-processed-videos"
    s3_bucket_thumbnails: str = "gymtok-thumbnails"
    sqs_queue_url: str = ""
    sqs_dlq_url: str = ""
    redis_url: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
