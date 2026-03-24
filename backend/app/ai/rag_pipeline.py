"""
app/ai/rag_pipeline.py
───────────────────────
Orchestrates the full RAG query pipeline:
  Question → Preprocessing → BM25 Retrieve → Cosine Re-rank → Format Answer

Optional OpenAI step: if OPENAI_API_KEY is set in the environment,
retrieved context is sent to GPT-4o-mini for a generated answer.
Otherwise, the top retrieved chunk forms the answer directly.

Returns:
  {
    "answer":     str,
    "sources":    [{title, source, score, tags}],
    "confidence": float,
    "method":     "bm25" | "openai"
  }
"""
import logging
import os
from typing import Optional

from flask import current_app, g

logger = logging.getLogger(__name__)

# ── Corpus / index cache ─────────────────────────────────────────
_STORE = None  # Module-level singleton; built once per process


def _get_store():
    """
    Return the VectorStore singleton, building it on first call.
    Thread-safe via Python's GIL (single-process Waitress/dev server).
    Fine for production too since index is read-only after build.
    """
    global _STORE
    if _STORE is None:
        from app.ai.corpus.loader import build_corpus
        from app.ai.vector_store import VectorStore
        logger.info("RAG: Building vector store (first request)…")
        corpus = build_corpus()
        _STORE = VectorStore.build(corpus)
        logger.info(f"RAG: Vector store ready — {len(corpus)} documents")
    return _STORE


def _format_answer(results) -> str:
    """
    Format retrieved chunks into a structured answer string.
    Used when no OpenAI key is set.
    """
    if not results:
        return (
            "I don't have specific notes on that topic yet. "
            "Try asking about buffer overflows, ROP chains, SQL injection, "
            "XSS, JWT attacks, or prompt injection."
        )

    top = results[0]
    answer = top.answer

    # Add related info from additional results if they're above threshold
    additional = [
        r for r in results[1:3]
        if r.score > 0.25 and r.doc_id != top.doc_id
    ]
    if additional:
        related = "; ".join(r.title for r in additional)
        answer += f"\n\n**Related topics in my notes**: {related}."

    return answer


def _openai_generate(question: str, context: str) -> Optional[str]:
    """
    Optional: send question + context to OpenAI GPT-4o-mini.
    Returns None if API key not set or call fails.
    """
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        return None

    try:
        import urllib.request
        import json

        model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        system_prompt = (
            "You are a cybersecurity expert assistant. Answer the user's security question "
            "based ONLY on the provided context from my research notes. Be precise and technical. "
            "If the context doesn't cover the question, say so honestly."
        )
        payload = json.dumps({
            "model": model,
            "messages": [
                {"role": "system",  "content": system_prompt},
                {"role": "user",    "content": f"Context:\n{context}\n\nQuestion: {question}"},
            ],
            "max_tokens": 500,
            "temperature": 0.2,
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=payload,
            headers={
                "Content-Type":  "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return data["choices"][0]["message"]["content"].strip()

    except Exception as exc:
        logger.warning(f"RAG: OpenAI call failed — {exc}")
        return None


def run_pipeline(question: str, top_k: int = 5) -> dict:
    """
    Full RAG query pipeline.

    Args:
        question: Sanitised user question (prompt injection already checked)
        top_k:    Number of sources to retrieve

    Returns:
        dict with answer, sources, confidence, method
    """
    top_k = max(1, min(top_k, 10))

    store   = _get_store()
    results = store.search(question, top_k=top_k)

    confidence = round(results[0].score, 3) if results else 0.0
    sources = [
        {
            "title":  r.title,
            "source": r.source,
            "score":  round(r.score, 3),
            "tags":   r.tags[:5],
        }
        for r in results
    ]

    method = "bm25"
    answer = _format_answer(results)

    # Optional: OpenAI generation if API key present
    if results and os.environ.get("OPENAI_API_KEY"):
        context = "\n\n".join(
            f"[{r.title}]\n{r.answer}"
            for r in results[:3]
        )
        generated = _openai_generate(question, context)
        if generated:
            answer = generated
            method = "openai"

    logger.info(
        f"RAG: question='{question[:60]}…' "
        f"hits={len(results)} confidence={confidence} method={method}"
    )

    return {
        "answer":     answer,
        "sources":    sources,
        "confidence": confidence,
        "method":     method,
    }


def invalidate_cache() -> None:
    """
    Force rebuild of the vector store (e.g. after admin adds new content).
    Called by admin routes after POST/DELETE on blog/project.
    """
    global _STORE
    _STORE = None
    logger.info("RAG: Vector store cache invalidated — will rebuild on next query")
