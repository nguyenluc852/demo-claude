from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.constants import AppMeta, Business


class Settings(BaseSettings):
    """Application settings, loaded from environment or .env file."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Smart Motel API"
    version: str = AppMeta.VERSION
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]

    mongodb_url: str = "mongodb://motel:motel@localhost:27017/motel?authSource=admin"
    mongodb_db: str = "motel"

    jwt_secret: str = "change-me-in-production"
    jwt_expire_minutes: int = 720

    public_base_url: str = "http://localhost:5173"

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "no-reply@motel.local"
    smtp_use_tls: bool = True

    invoice_cron_day: int = 5
    invoice_cron_hour: int = 8

    @property
    def smtp_enabled(self) -> bool:
        """Without a host the mailer logs instead of sending, so dev needs no server."""
        return bool(self.smtp_host)

    @property
    def payment_due_days(self) -> int:
        return Business.PAYMENT_DUE_DAYS


settings = Settings()
