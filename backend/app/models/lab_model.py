"""
app/models/lab_model.py
────────────────────────
SQLAlchemy model for cybersecurity lab notebook entries.
Each entry can optionally reference an uploaded file (UUID-named).
"""
from datetime import datetime, timezone

from app.extensions import db


class LabEntry(db.Model):
    __tablename__ = "lab_entries"

    id: int = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title: str = db.Column(db.String(255), nullable=False)
    notes: str = db.Column(db.Text, nullable=True)
    category: str = db.Column(db.String(100), nullable=True)  # e.g. "buffer-overflow"

    # File attachment (optional — set only after a successful upload)
    file_id: str = db.Column(db.String(36), nullable=True)    # UUID
    file_name: str = db.Column(db.String(255), nullable=True) # Original filename (display only)

    created_at: datetime = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "notes": self.notes,
            "category": self.category,
            "file_id": self.file_id,
            "file_name": self.file_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<LabEntry id={self.id} title={self.title!r}>"
