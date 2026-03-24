"""
app/ai/embeddings.py
───────────────────────
Text processing utilities for RAG retrieval.
No ML framework required — pure Python + numpy.

Functions:
  tokenize(text)             → List[str]
  tfidf_vector(tokens, idf)  → np.ndarray
  cosine_similarity(a, b)    → float
  build_idf(corpus_tokens)   → Dict[str, float]
"""
import math
import re
from collections import Counter
from typing import List, Dict
import numpy as np

# ── Stop words (small set — security terms excluded deliberately) ──
_STOP_WORDS = frozenset({
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to",
    "for", "of", "with", "by", "from", "as", "is", "was", "are",
    "were", "be", "been", "being", "have", "has", "had", "do", "does",
    "did", "will", "would", "could", "should", "may", "might", "must",
    "can", "it", "its", "this", "that", "these", "those", "if", "then",
    "than", "so", "such", "when", "where", "which", "who", "what",
    "how", "i", "you", "we", "they", "he", "she", "his", "her", "our",
    "your", "their", "my", "me", "him", "us", "them", "not", "no",
})


def tokenize(text: str) -> List[str]:
    """
    Lowercase, split on word boundaries, strip stop words.
    Preserves technical tokens like 'tcache', 'NX/DEP', '0x41414141'.
    """
    text = text.lower()
    # Replace hyphens/slashes between words with space (handles 'bm25', 'sql-injection')
    text = re.sub(r'[/\\]', ' ', text)
    # Extract alphanumeric tokens (keep digits — important for hex addresses etc.)
    tokens = re.findall(r'\b[a-z0-9][a-z0-9_-]{1,}\b', text)
    return [t for t in tokens if t not in _STOP_WORDS and len(t) > 1]


def build_idf(corpus_tokens: List[List[str]]) -> Dict[str, float]:
    """
    Compute IDF (Inverse Document Frequency) over the corpus.
    idf[term] = log((N + 1) / (df + 1)) + 1   (smooth IDF)
    """
    N = len(corpus_tokens)
    df: Dict[str, int] = {}
    for tokens in corpus_tokens:
        for term in set(tokens):
            df[term] = df.get(term, 0) + 1
    idf = {
        term: math.log((N + 1) / (count + 1)) + 1.0
        for term, count in df.items()
    }
    return idf


def tfidf_vector(
    tokens: List[str],
    idf: Dict[str, float],
    vocab: List[str],
) -> np.ndarray:
    """
    Compute a TF-IDF vector for a list of tokens given an IDF dict and vocab list.
    Returns a dense numpy vector aligned to `vocab`.
    """
    tf_raw = Counter(tokens)
    total  = len(tokens) or 1
    vec    = np.zeros(len(vocab), dtype=np.float32)
    for i, term in enumerate(vocab):
        if term in tf_raw:
            tf  = tf_raw[term] / total
            idf_val = idf.get(term, 1.0)
            vec[i] = tf * idf_val
    return vec


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Cosine similarity between two vectors. Returns 0.0 if either vector is zero.
    """
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))
