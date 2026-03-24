"""
app/ai/corpus/loader.py
────────────────────────
Loads and merges the three-tier security knowledge corpus:

  Tier 1 — Static curated Q&A (security_qa.json)
  Tier 2 — Live DB entries: blog posts, projects, lab entries
  Tier 3 — (Future) External documents added via admin upload

Returns a flat list of Document dicts:
  {id, text, title, source, tags}
"""
import json
import logging
from pathlib import Path
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

_CORPUS_FILE = Path(__file__).parent / "security_qa.json"


def _load_static() -> List[Dict[str, Any]]:
    """Load curated Q&A pairs from security_qa.json."""
    try:
        data = json.loads(_CORPUS_FILE.read_text(encoding="utf-8"))
        docs = []
        for item in data:
            # Combine question + answer into a single searchable document
            text = f"{item['question']} {item['answer']}"
            docs.append({
                "id":     item["id"],
                "title":  item["title"],
                "text":   text,
                "answer": item["answer"],
                "source": "static",
                "tags":   item.get("tags", []),
            })
        logger.info(f"RAG CORPUS: Loaded {len(docs)} static Q&A entries")
        return docs
    except Exception as exc:
        logger.error(f"RAG CORPUS: Failed to load static corpus — {exc}")
        return []


def _load_from_db() -> List[Dict[str, Any]]:
    """
    Load live entries from the database (blog posts + projects + lab entries).
    Called within an active Flask app context.
    """
    docs = []
    try:
        from app.extensions import db
        from app.models.blog_model import BlogPost
        from app.models.project_model import Project
        from app.models.lab_model import LabEntry

        # Published blog posts
        posts = db.session.execute(
            db.select(BlogPost).where(BlogPost.published == True)  # noqa: E712
        ).scalars().all()
        for p in posts:
            text = f"{p.title} {p.content or ''}"
            docs.append({
                "id":     f"blog_{p.id}",
                "title":  p.title,
                "text":   text[:3000],  # Cap to avoid huge docs
                "answer": (p.content or "")[:800],
                "source": "blog",
                "tags":   p.tags,
            })

        # All projects
        projects = db.session.execute(db.select(Project)).scalars().all()
        for pr in projects:
            text = f"{pr.title} {pr.description or ''}"
            docs.append({
                "id":     f"project_{pr.id}",
                "title":  pr.title,
                "text":   text,
                "answer": pr.description or pr.title,
                "source": "project",
                "tags":   pr.tags,
            })

        # Lab entries
        labs = db.session.execute(db.select(LabEntry)).scalars().all()
        for lab in labs:
            text = f"{lab.title} {lab.notes or ''}"
            docs.append({
                "id":     f"lab_{lab.id}",
                "title":  lab.title,
                "text":   text,
                "answer": lab.notes or lab.title,
                "source": "lab",
                "tags":   [],
            })

        if docs:
            logger.info(f"RAG CORPUS: Loaded {len(docs)} live DB entries")
    except Exception as exc:
        # DB unavailable during testing or startup — not fatal
        logger.warning(f"RAG CORPUS: Could not load DB entries — {exc}")

    return docs


def build_corpus() -> List[Dict[str, Any]]:
    """
    Build the complete corpus from all tiers.
    Safe to call inside or outside of an app context.
    """
    corpus = _load_static() + _load_from_db()
    logger.info(f"RAG CORPUS: Total {len(corpus)} documents in corpus")
    return corpus
