"""
app/models/project_model.py
─────────────────────────────
SQLAlchemy model for portfolio projects.
"""
import json
from datetime import datetime, timezone

from app.extensions import db


class Project(db.Model):
    __tablename__ = "projects"

    id: int = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title: str = db.Column(db.String(255), nullable=False)
    slug: str = db.Column(db.String(255), unique=True, nullable=False, index=True)
    description: str = db.Column(db.Text, nullable=True)
    _tags: str = db.Column("tags", db.Text, nullable=True, default="[]")
    github_url: str = db.Column(db.String(500), nullable=True)
    live_url: str = db.Column(db.String(500), nullable=True)
    created_at: datetime = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Tag helpers ───────────────────────────────────────────────

    @property
    def tags(self) -> list[str]:
        try:
            return json.loads(self._tags or "[]")
        except (json.JSONDecodeError, TypeError):
            return []

    @tags.setter
    def tags(self, value: list[str]) -> None:
        self._tags = json.dumps(value if isinstance(value, list) else [])

    # ── Serialisation ─────────────────────────────────────────────

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "description": self.description,
            "tags": self.tags,
            "github_url": self.github_url,
            "live_url": self.live_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f"<Project id={self.id} slug={self.slug!r}>"
