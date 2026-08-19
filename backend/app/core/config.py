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

    # Mail goes out over the Resend HTTP API. Either value missing means the
    # mailer logs the message instead of sending it, so a dev machine needs no
    # credential.
    #
    # email_from has no default on purpose. A plausible-looking one
    # ("no-reply@motel.local") is worse than none: the provider accepts the
    # request, then rejects every message because the domain is not verified,
    # and the deployment looks configured while nothing is delivered.
    resend_api_key: str = ""
    email_from: str = ""

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
        """Both halves are required: a key with no sender address cannot deliver."""
        return bool(self.resend_api_key and self.email_from)

    @property
    def payment_due_days(self) -> int:
        return Business.PAYMENT_DUE_DAYS


settings = Settings()
