"""
app/__init__.py
───────────────
Application factory: create_app(config_name).

All extensions, blueprints, and middleware are wired here.
Nothing is imported at module level that would cause circular imports.
"""
import os
import logging
from pathlib import Path

from flask import Flask

from .config import config_map
from .extensions import db, migrate, limiter, csrf, cors


def create_app(config_name: str | None = None) -> Flask:
    """
    Create and configure the Flask application.

    Args:
        config_name: One of 'development', 'production', 'testing'.
                     Falls back to FLASK_ENV env var, then 'default'.

    Returns:
        Configured Flask application instance.
    """
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "default")

    app = Flask(__name__, instance_relative_config=False)

    # ── Load configuration ────────────────────────────────────────
    cfg_class = config_map.get(config_name, config_map["default"])
    app.config.from_object(cfg_class)

    # ── Validate critical config values ───────────────────────────
    cfg_class.validate(app)

    # ── Ensure runtime directories exist ─────────────────────────
    _ensure_directories(app)

    # ── Initialise extensions ─────────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)

    limiter.init_app(app)

    csrf.init_app(app)
    # CSRF is exempt for JSON API endpoints — they use token auth or are read-only.
    # Explicit exemptions are declared in each blueprint via @csrf.exempt.

    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["ALLOWED_ORIGINS"]}},
        supports_credentials=False,
        expose_headers=["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
    )

    # ── Configure logging ─────────────────────────────────────────
    _configure_logging(app)

    # ── Register blueprints ───────────────────────────────────────
    _register_blueprints(app)

    # ── Register security hooks ───────────────────────────────────
    from .security.secure_headers import generate_request_id, apply_secure_headers
    app.before_request(generate_request_id)
    app.after_request(apply_secure_headers)

    # ── Create DB tables in dev/testing (migrations handle prod) ──
    if config_name in ("development", "testing"):
        with app.app_context():
            db.create_all()
            app.logger.info("Database tables ensured.")

    app.logger.info(f"App created — env={config_name}")
    return app


# ──────────────────────────────────────────────────────────────────
# Private helpers
# ──────────────────────────────────────────────────────────────────

def _ensure_directories(app: Flask) -> None:
    """Create runtime directories that are gitignored but required."""
    base = Path(app.root_path).parent  # backend/
    for folder in ("uploads", "logs"):
        (base / folder).mkdir(parents=True, exist_ok=True)


def _configure_logging(app: Flask) -> None:
    """Set up rotating JSON-structured file + console logging."""
    from logging.handlers import RotatingFileHandler
    import json

    log_dir = Path(app.root_path).parent / "logs"
    log_level = getattr(logging, app.config.get("LOG_LEVEL", "INFO"), logging.INFO)

    class JsonFormatter(logging.Formatter):
        def format(self, record: logging.LogRecord) -> str:
            payload = {
                "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
                "level": record.levelname,
                "logger": record.name,
                "msg": record.getMessage(),
            }
            if record.exc_info:
                payload["exc"] = self.formatException(record.exc_info)
            return json.dumps(payload)

    file_handler = RotatingFileHandler(
        log_dir / "app.log",
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(JsonFormatter())
    file_handler.setLevel(log_level)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)

    app.logger.setLevel(log_level)
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)

    # Suppress Werkzeug's default logger in non-debug mode
    if not app.debug:
        logging.getLogger("werkzeug").setLevel(logging.WARNING)


def _register_blueprints(app: Flask) -> None:
    """Import and register all route blueprints."""
    from .routes.main_routes import main_bp
    from .routes.project_routes import project_bp
    from .routes.blog_routes import blog_bp
    from .routes.lab_routes import lab_bp
    from .routes.rag_routes import rag_bp
    from .routes.simulation_routes import simulation_bp
    from .routes.admin_routes import admin_bp

    app.register_blueprint(main_bp,       url_prefix="/api")
    app.register_blueprint(project_bp,    url_prefix="/api")
    app.register_blueprint(blog_bp,       url_prefix="/api")
    app.register_blueprint(lab_bp,        url_prefix="/api")
    app.register_blueprint(rag_bp,        url_prefix="/api")
    app.register_blueprint(simulation_bp, url_prefix="/api")
    app.register_blueprint(admin_bp,      url_prefix="/api/admin")
