"""
app/security/rate_limiter.py
─────────────────────────────
Per-route rate limit decorators wrapping Flask-Limiter.
Import the specific limiter from this module in each route file.

Usage in a route:
    from app.security.rate_limiter import rl_default, rl_rag, rl_upload, rl_admin

    @project_bp.route("/projects")
    @rl_default
    def list_projects(): ...
"""
from functools import wraps
from flask_limiter import Limiter
from app.extensions import limiter


def _make_limit(limit_string: str):
    """Return a decorator that applies a specific rate limit string."""
    def decorator(f):
        @wraps(f)
        @limiter.limit(limit_string)
        def wrapped(*args, **kwargs):
            return f(*args, **kwargs)
        return wrapped
    return decorator


# ── Named limiters for semantic clarity in route files ────────────

# Standard read endpoints
rl_default = _make_limit("60 per minute")

# Computationally expensive — RAG pipeline queries
rl_rag = _make_limit("10 per minute")

# File uploads — disk I/O + validation cost
rl_upload = _make_limit("5 per minute")

# Admin write operations
rl_admin = _make_limit("20 per minute")
