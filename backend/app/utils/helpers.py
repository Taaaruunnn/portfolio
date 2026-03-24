"""
app/utils/helpers.py
─────────────────────
Pure utility functions shared across the application.
"""
import re
from datetime import datetime, timezone


def slugify(text: str) -> str:
    """
    Convert a title string to a URL-safe slug.
    Example: "Buffer Overflow 101!" → "buffer-overflow-101"
    """
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-{2,}", "-", text)
    text = text.strip("-")
    return text


def paginate(select_stmt, page: int, per_page: int) -> dict:
    """
    Paginate a SQLAlchemy 2.x Select statement using db.paginate().

    Args:
        select_stmt: A SQLAlchemy Select object (NOT an executed result).
        page:        1-indexed page number.
        per_page:    Items per page (capped to MAX_PAGE_SIZE).

    Returns:
        {"items": [...], "page": int, "per_page": int, "total": int, "pages": int}
    """
    from app.extensions import db
    from app.utils.constants import MAX_PAGE_SIZE

    page = max(1, int(page))
    per_page = min(int(per_page), MAX_PAGE_SIZE)

    # Flask-SQLAlchemy 3.x: db.paginate() accepts a Select statement directly.
    pagination = db.paginate(select_stmt, page=page, per_page=per_page, error_out=False)

    return {
        "items": [item.to_dict() for item in pagination.items],
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total,
        "pages": pagination.pages,
    }


def utcnow() -> datetime:
    """Return the current UTC time as a timezone-aware datetime."""
    return datetime.now(timezone.utc)


def safe_int(value, default: int = 1, minimum: int = 1) -> int:
    """
    Parse an integer from a query param safely.
    Returns default if value is None or not a valid int.
    Enforces a minimum.
    """
    try:
        return max(minimum, int(value))
    except (TypeError, ValueError):
        return default
