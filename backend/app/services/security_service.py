"""
app/services/security_service.py
──────────────────────────────────
Admin token authentication decorator.

Protection design:
  - Token sent in X-Admin-Token request header
  - Compared with constant-time digest to prevent timing attacks
  - Rate-limited to 20 req/min via Flask-Limiter
  - All attempts (success + failure) are logged with IP and endpoint
  - Token value is NEVER logged
"""
import hmac
import logging
from functools import wraps

from flask import request, jsonify, current_app

logger = logging.getLogger(__name__)


def require_admin_token(f):
    """
    Decorator: protects a route with admin token authentication.

    Expected header: X-Admin-Token: <value from .env ADMIN_TOKEN>

    Returns 401 on missing or invalid token.
    Returns 500 if ADMIN_TOKEN is not configured (misconfiguration guard).
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        admin_token: str = current_app.config.get("ADMIN_TOKEN", "")
        client_ip: str = request.remote_addr or "unknown"
        endpoint: str = request.endpoint or "unknown"

        # Guard: server misconfiguration
        if not admin_token:
            logger.error(
                f"ADMIN AUTH: ADMIN_TOKEN not configured. "
                f"ip={client_ip} endpoint={endpoint}"
            )
            return jsonify({"error": "Server configuration error."}), 500

        # Extract token from header
        provided_token: str = request.headers.get("X-Admin-Token", "")

        # Constant-time comparison (prevents timing oracle attacks)
        token_valid = hmac.compare_digest(
            provided_token.encode("utf-8"),
            admin_token.encode("utf-8"),
        )

        if not token_valid:
            logger.warning(
                f"ADMIN AUTH: FAILED. ip={client_ip} endpoint={endpoint}"
            )
            return jsonify({"error": "Unauthorized."}), 401

        logger.info(
            f"ADMIN AUTH: SUCCESS. ip={client_ip} endpoint={endpoint}"
        )
        return f(*args, **kwargs)

    return decorated
