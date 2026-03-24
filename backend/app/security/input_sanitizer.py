"""
app/security/input_sanitizer.py
────────────────────────────────
Sanitize user-supplied string inputs to strip HTML/script injection.
Uses bleach to remove all HTML tags — the API only expects plain text / JSON.

Call sanitize_request_json() at the top of any POST/PUT route handler.
"""
import bleach
from flask import Request


def sanitize_string(value: str) -> str:
    """
    Strip all HTML tags and attributes from a string.
    bleach.clean with no allowed tags converts '<script>alert(1)</script>'
    → 'alert(1)' (tag removed, content preserved).
    """
    if not isinstance(value, str):
        return value
    return bleach.clean(value, tags=[], attributes={}, strip=True)


def sanitize_dict(data: dict) -> dict:
    """
    Recursively sanitize all string values inside a dict.
    Handles nested dicts and lists of strings.
    """
    if not isinstance(data, dict):
        return data

    cleaned = {}
    for key, value in data.items():
        if isinstance(value, str):
            cleaned[key] = sanitize_string(value)
        elif isinstance(value, dict):
            cleaned[key] = sanitize_dict(value)
        elif isinstance(value, list):
            cleaned[key] = [
                sanitize_string(item) if isinstance(item, str) else item
                for item in value
            ]
        else:
            cleaned[key] = value
    return cleaned


def sanitize_request_json(request: Request) -> dict:
    """
    Extract and sanitize the JSON body from a Flask request.
    Returns an empty dict if the body is not valid JSON.
    Sanitizes all string values before returning.
    """
    data = request.get_json(silent=True, force=True) or {}
    return sanitize_dict(data)
