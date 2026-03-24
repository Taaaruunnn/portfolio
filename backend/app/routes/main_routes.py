"""
app/routes/main_routes.py
──────────────────────────
Health check and metadata endpoints.
These are always public and always available — used by nginx health probes.
"""
from datetime import datetime, timezone

from flask import Blueprint, jsonify

from app.utils.constants import API_VERSION, PORTFOLIO_TITLE

main_bp = Blueprint("main_bp", __name__)


@main_bp.route("/health", methods=["GET"])
def health():
    """
    GET /api/health
    Returns server health status. Used by nginx, uptime monitors, and CI checks.
    """
    return jsonify({
        "status": "ok",
        "ts": datetime.now(timezone.utc).isoformat(),
        "version": API_VERSION,
    }), 200


@main_bp.route("/meta", methods=["GET"])
def meta():
    """
    GET /api/meta
    Returns public portfolio metadata for the frontend to consume.
    """
    return jsonify({
        "title": PORTFOLIO_TITLE,
        "version": API_VERSION,
        "description": "Cybersecurity portfolio API — public read-only endpoints.",
    }), 200
