"""
app/security/secure_headers.py
───────────────────────────────
after_request + before_request hooks:
  1. Injects security response headers on every reply
  2. Generates a UUID4 request ID, stores in g, returns as X-Request-ID header

Registered in the application factory via app.before/after_request().
"""
import uuid
from flask import Response, g, request


def generate_request_id() -> None:
    """
    before_request: generate a unique request ID for log correlation.
    Stored in flask.g so log handlers can access it.
    """
    g.request_id = str(uuid.uuid4())


def apply_secure_headers(response: Response) -> Response:
    """
    after_request: inject security + correlation headers.
    Applied AFTER every response regardless of route or status code.
    """
    headers = {
        # ── Clickjacking / framing ────────────────────────────────
        "X-Frame-Options":       "DENY",
        "X-Content-Type-Options":"nosniff",

        # ── XSS ──────────────────────────────────────────────────
        "X-XSS-Protection":     "1; mode=block",

        # ── Referrer ─────────────────────────────────────────────
        "Referrer-Policy":      "strict-origin-when-cross-origin",

        # ── CSP ── strict for a pure JSON API ────────────────────
        # No scripts, no iframes, no external resources.
        "Content-Security-Policy": (
            "default-src 'none'; "
            "frame-ancestors 'none'; "
            "base-uri 'none'; "
            "form-action 'none';"
        ),

        # ── Permissions ───────────────────────────────────────────
        "Permissions-Policy":   "geolocation=(), microphone=(), camera=()",

        # ── HSTS (activate when HTTPS is enabled in Phase 8) ─────
        # "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",

        # ── Server banner ─────────────────────────────────────────
        "Server": "cybersec-portfolio",
    }

    for key, value in headers.items():
        response.headers[key] = value

    # ── Correlation ID ────────────────────────────────────────────
    rid = getattr(g, "request_id", None)
    if rid:
        response.headers["X-Request-ID"] = rid

    return response
