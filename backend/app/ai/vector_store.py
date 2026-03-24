"""
app/ai/vector_store.py
───────────────────────
BM25 Okapi vector store for RAG retrieval.

Uses rank-bm25 (pure Python, Python 3.14 compatible).
Wraps the BM25Okapi index with corpus metadata for source attribution.

Public API:
  VectorStore.build(documents)          → VectorStore instance
  VectorStore.search(query, top_k)      → List[SearchResult]
  VectorStore.from_app_context()        → cached singleton (via g)
"""
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

from rank_bm25 import BM25Okapi

from app.ai.embeddings import (
    tokenize, build_idf, tfidf_vector, cosine_similarity
)

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    doc_id:     str
    title:      str
    answer:     str
    source:     str
    tags:       List[str]
    bm25_score: float
    cos_score:  float
    score:      float   # combined score


class VectorStore:
    """
    In-memory BM25 + cosine re-rank search engine over the security corpus.
    """

    def __init__(
        self,
        documents: List[Dict[str, Any]],
        corpus_tokens: List[List[str]],
        bm25: BM25Okapi,
        idf: Dict[str, float],
        vocab: List[str],
    ):
        self._docs          = documents
        self._corpus_tokens = corpus_tokens
        self._bm25          = bm25
        self._idf           = idf
        self._vocab         = vocab

        # Precompute TF-IDF vectors for all docs (for cosine re-rank)
        self._doc_vectors = [
            tfidf_vector(tokens, idf, vocab)
            for tokens in corpus_tokens
        ]
        logger.info(
            f"VectorStore: built over {len(documents)} documents, "
            f"vocab={len(vocab)} terms"
        )

    # ── Factory ──────────────────────────────────────────────────────

    @classmethod
    def build(cls, documents: List[Dict[str, Any]]) -> "VectorStore":
        """Build BM25 index from a list of Document dicts."""
        if not documents:
            logger.warning("VectorStore.build called with empty corpus")
            # Return an empty store that will return no results
            corpus_tokens: List[List[str]] = [[]]
            bm25 = BM25Okapi(corpus_tokens)
            return cls([], [[]], bm25, {}, [])

        corpus_tokens = [tokenize(doc["text"]) for doc in documents]
        idf           = build_idf(corpus_tokens)
        vocab         = sorted(idf.keys())
        bm25          = BM25Okapi(corpus_tokens)

        return cls(documents, corpus_tokens, bm25, idf, vocab)

    # ── Search ───────────────────────────────────────────────────────

    def search(self, query: str, top_k: int = 5) -> List[SearchResult]:
        """
        Two-stage retrieval:
          1. BM25 → top 20 candidates
          2. TF-IDF cosine similarity re-rank → final top_k
        """
        if not self._docs:
            return []

        query_tokens = tokenize(query)
        if not query_tokens:
            return []

        # Stage 1: BM25 retrieve up to 20 candidates
        bm25_scores: List[float] = self._bm25.get_scores(query_tokens).tolist()
        candidate_count = min(20, len(self._docs))
        candidates = sorted(
            enumerate(bm25_scores), key=lambda x: x[1], reverse=True
        )[:candidate_count]

        # Stage 2: cosine re-rank
        query_vec = tfidf_vector(query_tokens, self._idf, self._vocab)
        results: List[SearchResult] = []

        for idx, bm25_score in candidates:
            if bm25_score <= 0:
                continue
            cos = cosine_similarity(query_vec, self._doc_vectors[idx])
            # Combine: 60% BM25 (normalised) + 40% cosine
            max_bm25 = candidates[0][1] if candidates[0][1] > 0 else 1.0
            norm_bm25 = bm25_score / max_bm25
            combined = 0.60 * norm_bm25 + 0.40 * cos

            doc = self._docs[idx]
            results.append(SearchResult(
                doc_id=    doc["id"],
                title=     doc["title"],
                answer=    doc["answer"],
                source=    doc["source"],
                tags=      doc.get("tags", []),
                bm25_score=bm25_score,
                cos_score= cos,
                score=     combined,
            ))

        # Sort by combined score, return top_k
        results.sort(key=lambda r: r.score, reverse=True)
        return results[:top_k]
