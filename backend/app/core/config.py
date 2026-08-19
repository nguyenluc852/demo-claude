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

    # Mail goes out over the Resend HTTP API. Empty key means the mailer logs
    # the message instead of sending it, so a dev machine needs no credential.
    resend_api_key: str = ""
    email_from: str = "no-reply@motel.local"

    invoice_cron_day: int = 5
    invoice_cron_hour: int = 8

    # Turn off where the process does not stay alive between requests (a free
    # tier that sleeps); the dispatch endpoint then carries the monthly run.
    scheduler_enabled: bool = True

    # Shared secret for the machine-to-machine dispatch endpoint. Empty means
    # the endpoint refuses everything — never that it is open.
    cron_secret: str = ""

    # Seed operator, read from the environment so no credential is committed.
    # Empty password means `scripts.seed` refuses to run — never that it falls
    # back to a default one.
    seed_admin_username: str = "admin"
    seed_admin_email: str = "admin@smart.dev"
    seed_admin_password: str = ""

    @property
    def email_enabled(self) -> bool:
        """Without a key the mailer logs instead of sending, so dev needs no account."""
        return bool(self.resend_api_key)

    @property
    def payment_due_days(self) -> int:
        return Business.PAYMENT_DUE_DAYS


settings = Settings()
