"""
app/services/rag_service.py
────────────────────────────
Public API for the RAG pipeline — called by rag_routes.

Validates the question before passing to the pipeline.
Pipeline is lazy-loaded (first query triggers index build).
"""
import logging

logger = logging.getLogger(__name__)

_MIN_LEN = 5
_MAX_LEN = 1000


def query_rag(question: str) -> dict:
    """
    Validate and run the RAG query pipeline.

    Args:
        question: Raw user question string (already prompt-injection-checked
                  by middleware before this is called)

    Returns:
        dict: {answer, sources, confidence, method}

    Raises:
        ValueError: for invalid question length/content
    """
    q = question.strip()

    if len(q) < _MIN_LEN:
        raise ValueError(f"Question too short (minimum {_MIN_LEN} characters).")
    if len(q) > _MAX_LEN:
        raise ValueError(f"Question too long (maximum {_MAX_LEN} characters).")

    from app.ai.rag_pipeline import run_pipeline
    return run_pipeline(q)
