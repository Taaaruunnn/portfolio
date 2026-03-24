"""
app/routes/rag_routes.py
─────────────────────────
RAG (Retrieval-Augmented Generation) query endpoint.
"""
from flask import Blueprint, jsonify, request

from app.extensions import limiter
from app.security.input_sanitizer import sanitize_request_json
from app.security.prompt_injection_guard import validate_prompt
from app.utils.constants import RATE_RAG

rag_bp = Blueprint("rag_bp", __name__)


@rag_bp.route("/rag/query", methods=["POST"])
@limiter.limit(RATE_RAG)
def rag_query():
    """
    POST /api/rag/query
    Body: {"question": "..."}
    Returns: {answer, sources, confidence, method}
    """
    data     = sanitize_request_json(request)
    question = data.get("question", "")

    # ── Prompt injection guard ────────────────────────────────────
    guard = validate_prompt(question)
    if not guard.is_safe:
        return jsonify({"error": guard.reason}), 400

    # ── RAG pipeline ──────────────────────────────────────────────
    try:
        from app.services.rag_service import query_rag
        result = query_rag(question)
        return jsonify(result), 200

    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    except Exception as exc:
        # Log internally but don't expose internals
        from app.services.logging_service import get_logger
        get_logger(__name__).error(f"RAG pipeline error: {exc}", exc_info=True)
        return jsonify({"error": "An error occurred processing your question."}), 500
