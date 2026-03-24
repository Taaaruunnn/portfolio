"""
app/extensions.py
─────────────────
Single-source-of-truth for all Flask extension instances.
Imported by __init__.py (factory) and any module that needs them.
Extensions are created here but NOT bound to an app yet.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_wtf.csrf import CSRFProtect
from flask_cors import CORS

# ── Database ──────────────────────────────────────────────────────
db = SQLAlchemy()
migrate = Migrate()

# ── Security ──────────────────────────────────────────────────────
# key_func reads the real client IP (nginx sets X-Real-IP in prod).
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60 per minute"],
    storage_uri="memory://",
)

csrf = CSRFProtect()
cors = CORS()
