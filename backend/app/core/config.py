from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.constants import AppMeta


class Settings(BaseSettings):
    """Application settings, loaded from environment or .env file."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "ClaudePractice API"
    version: str = AppMeta.VERSION
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
