"""
app/security/csrf_protection.py
────────────────────────────────
CSRF configuration helpers.

Flask-WTF's CSRFProtect is initialised globally in extensions.py.
This module provides:
  - A list of blueprints/routes that are CSRF-exempt (token-auth replaces it)
  - A helper to register exemptions after blueprint registration

Why exempt API routes:
  - Admin routes use X-Admin-Token (token replaces CSRF)
  - RAG and simulation routes are stateless JSON endpoints
  - File upload uses CSRF via X-CSRFToken header from the React SPA
"""
from flask import Flask
from flask_wtf.csrf import CSRFProtect

# Blueprints that are fully exempt from CSRF checks.
# These either use token-based auth or are stateless read/query endpoints.
CSRF_EXEMPT_BLUEPRINTS = [
    "admin_bp",
    "rag_bp",
    "simulation_bp",
]


def register_csrf_exemptions(app: Flask, csrf: CSRFProtect) -> None:
    """
    Exempt specific blueprints from CSRF protection.
    Call this AFTER blueprints are registered so view functions exist.
    """
    for blueprint_name in CSRF_EXEMPT_BLUEPRINTS:
        blueprint = app.blueprints.get(blueprint_name)
        if blueprint:
            for endpoint, view_func in app.view_functions.items():
                if endpoint.startswith(f"{blueprint_name}."):
                    csrf.exempt(view_func)
