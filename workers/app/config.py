from pydantic_settings import BaseSettings


class WorkerSettings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:54322/postgres"
    supabase_url: str = "https://placeholder.supabase.co"
    supabase_service_role_key: str = "placeholder-service-role-key-replace-me"
    poll_interval: int = 5
    frame_extract_interval: int = 2
    yolo_model_path: str = "models/yolov8n.pt"
    moderation_threshold: float = 0.7
    uploads_dir: str = "/data/uploads"
    storage_bucket_raw: str = "raw-uploads"
    storage_bucket_processed: str = "processed-videos"
    storage_bucket_thumbnails: str = "thumbnails"
    use_placeholders: bool = True
    http_port: int = 8001

    class Config:
        env_file = ".env"


settings = WorkerSettings()
