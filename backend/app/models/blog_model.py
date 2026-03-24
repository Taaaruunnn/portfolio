"""
app/models/blog_model.py
─────────────────────────
SQLAlchemy model for blog posts (Markdown content).
"""
import json
from datetime import datetime, timezone

from app.extensions import db


class BlogPost(db.Model):
    __tablename__ = "blog_posts"

    id: int = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title: str = db.Column(db.String(255), nullable=False)
    slug: str = db.Column(db.String(255), unique=True, nullable=False, index=True)
    content: str = db.Column(db.Text, nullable=True)          # Markdown
    _tags: str = db.Column("tags", db.Text, nullable=True, default="[]")
    published: bool = db.Column(db.Boolean, nullable=False, default=False)
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

    @property
    def tags(self) -> list[str]:
        try:
            return json.loads(self._tags or "[]")
        except (json.JSONDecodeError, TypeError):
            return []

    @tags.setter
    def tags(self, value: list[str]) -> None:
        self._tags = json.dumps(value if isinstance(value, list) else [])

    def to_dict(self, include_content: bool = True) -> dict:
        data = {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "tags": self.tags,
            "published": self.published,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_content:
            data["content"] = self.content
        return data

    def __repr__(self) -> str:
        return f"<BlogPost id={self.id} slug={self.slug!r} published={self.published}>"
