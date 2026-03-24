"""
app/utils/constants.py
───────────────────────
Shared constants used across the application.
Import these instead of hard-coding values in route or service files.
"""
import os

# ── File uploads ────────────────────────────────────────────────────
ALLOWED_EXTENSIONS: set[str] = {".pdf", ".md", ".txt", ".png", ".jpg", ".jpeg"}

# Corresponding MIME types verified by magic-byte inspection.
# Must stay in sync with ALLOWED_EXTENSIONS.
ALLOWED_MIMES: set[str] = {
    "application/pdf",
    "text/plain",
    "image/png",
    "image/jpeg",
    # .md files are plain text — detected as text/plain
}

MAX_UPLOAD_BYTES: int = int(os.getenv("MAX_UPLOAD_MB", "10")) * 1024 * 1024

# ── Rate limits (string DSL for Flask-Limiter) ──────────────────────
RATE_DEFAULT: str = "60 per minute"
RATE_RAG: str = "10 per minute"
RATE_UPLOAD: str = "5 per minute"
RATE_ADMIN: str = "20 per minute"

# ── Pagination ──────────────────────────────────────────────────────
DEFAULT_PAGE_SIZE: int = 20
MAX_PAGE_SIZE: int = 100

# ── Admin auth header ───────────────────────────────────────────────
ADMIN_TOKEN_HEADER: str = "X-Admin-Token"

# ── API version ────────────────────────────────────────────────────
API_VERSION: str = "1.0.0"
PORTFOLIO_TITLE: str = "Cybersecurity Portfolio"
