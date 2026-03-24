"""
app/services/logging_service.py
────────────────────────────────
Structured request/response logging for the portfolio API.

This module provides a helper to log HTTP request details in a
consistent, structured format. It is called from route handlers
or registered as a Flask before/after_request hook.

The application-level JSON logger (RotatingFileHandler) is configured
in the application factory (__init__.py). This module adds request context.
"""
import logging
import time
from functools import wraps
from flask import request, g

logger = logging.getLogger("cybersec.request")


def log_request_start() -> None:
    """Store request start time. Register as app.before_request hook."""
    g.request_start_time = time.perf_counter()


def log_request_end(response):
    """Log structured request summary. Register as app.after_request hook."""
    duration_ms = round(
        (time.perf_counter() - getattr(g, "request_start_time", time.perf_counter()))
        * 1000,
        2,
    )
    logger.info(
        "REQUEST",
        extra={
            "method": request.method,
            "path": request.path,
            "status": response.status_code,
            "ip": request.remote_addr,
            "ua": request.user_agent.string[:200] if request.user_agent else "",
            "duration_ms": duration_ms,
        },
    )
    return response


def log_admin_action(action: str, detail: str = "") -> None:
    """
    Log an admin write operation.
    Call this from admin route handlers after a successful DB write.

    Args:
        action: Short label, e.g. "CREATE_PROJECT", "DELETE_BLOG".
        detail: Optional context, e.g. slug or ID (no sensitive data).
    """
    logger.info(
        f"ADMIN ACTION: {action}",
        extra={
            "ip": request.remote_addr,
            "endpoint": request.endpoint,
            "detail": detail,
        },
    )
