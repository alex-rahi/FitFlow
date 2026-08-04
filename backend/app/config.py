from pydantic_settings import BaseSettings


class Settings(BaseSettings):
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

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
