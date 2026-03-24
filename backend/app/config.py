"""
app/config.py
─────────────
Configuration classes for Development and Production.
Loaded by the application factory in __init__.py.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration — shared across all environments."""

    # ── Flask core ────────────────────────────────────────────────
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-insecure-key-change-in-production")
    JSON_SORT_KEYS: bool = False

    # ── SQLAlchemy ────────────────────────────────────────────────
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_ECHO: bool = False

    # ── Flask-Limiter ─────────────────────────────────────────────
    RATELIMIT_STORAGE_URI: str = "memory://"
    RATELIMIT_DEFAULT: str = "60 per minute"
    RATELIMIT_HEADERS_ENABLED: bool = True

    # ── CORS ──────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173"
    ).split(",")

    # ── File uploads ──────────────────────────────────────────────
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "10"))
    MAX_CONTENT_LENGTH: int = MAX_UPLOAD_MB * 1024 * 1024  # Flask enforces this

    # ── Admin ─────────────────────────────────────────────────────
    ADMIN_TOKEN: str = os.getenv("ADMIN_TOKEN", "")

    # ── CSRF ──────────────────────────────────────────────────────
    # Disabled: this is a JSON REST API with token-based auth.
    # Flask-WTF CSRF form-tokens don't apply to JSON APIs.
    WTF_CSRF_ENABLED: bool = False

    # ── Logging ───────────────────────────────────────────────────
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    @staticmethod
    def validate(app) -> None:
        """Called after app creation — raises on missing critical config."""
        if not app.config["SECRET_KEY"] or app.config["SECRET_KEY"].startswith("dev-insecure"):
            if app.config["ENV"] == "production":
                raise ValueError("SECRET_KEY must be set in production.")
        if not app.config["ADMIN_TOKEN"]:
            raise ValueError("ADMIN_TOKEN must be set in .env before starting the server.")


class DevelopmentConfig(Config):
    """Development — verbose errors, SQLite, console logging."""

    ENV: str = "development"
    DEBUG: bool = True
    TESTING: bool = False
    SQLALCHEMY_DATABASE_URI: str = os.getenv("DATABASE_URL", "sqlite:///app.db")
    SQLALCHEMY_ECHO: bool = False  # Set True to log all SQL queries


class ProductionConfig(Config):
    """Production — strict errors, external DB, no debug."""

    ENV: str = "production"
    DEBUG: bool = False
    TESTING: bool = False
    SQLALCHEMY_DATABASE_URI: str = os.getenv("DATABASE_URL", "sqlite:///app.db")
    PROPAGATE_EXCEPTIONS: bool = False  # Generic 500s — no stack traces to client


class TestingConfig(Config):
    """Testing — in-memory SQLite, CSRF disabled, no rate limits."""

    ENV: str = "testing"
    DEBUG: bool = True
    TESTING: bool = True
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///:memory:"
    RATELIMIT_ENABLED: bool = False
    ADMIN_TOKEN: str = "test-admin-token-do-not-use-in-prod"


# Registry used by the application factory
config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}
