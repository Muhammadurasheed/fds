"""Application configuration settings."""
import os
from pydantic import BaseModel

class Settings(BaseModel):
    service_name: str = "formation-damage-api"
    service_version: str = "1.0.0"
    api_v1_prefix: str = "/api/v1"
    model_version: str = "1.0.0"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    max_dataset_rows: int = 50000

    @classmethod
    def from_env(cls) -> "Settings":
        origins_env = os.getenv("ALLOWED_ORIGINS")
        origins = [o.strip() for o in origins_env.split(",") if o.strip()] if origins_env else [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        return cls(cors_origins=origins)

settings = Settings.from_env()
