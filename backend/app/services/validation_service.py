"""
app/services/validation_service.py
────────────────────────────────────
Pydantic v1 schemas for validating POST request bodies.
(Pydantic v1 is pure-Python; compatible with Python 3.14+.)

All schemas use strict field definitions — no extra fields allowed.

Usage:
    from app.services.validation_service import ProjectCreate, validate

    result = validate(ProjectCreate, data_dict)
    if result.errors:
        return jsonify({"errors": result.errors}), 422
    project_data = result.data
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, List, Optional

from pydantic import BaseModel, Field, validator, ValidationError


# ──────────────────────────────────────────────────────────────────
# Shared validators
# ──────────────────────────────────────────────────────────────────

def _valid_slug(v: str) -> str:
    """Slugs must be lowercase alphanumeric + hyphens only."""
    if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", v):
        raise ValueError(
            "Slug must contain only lowercase letters, numbers, and hyphens."
        )
    return v


# ──────────────────────────────────────────────────────────────────
# Project schemas
# ──────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    tags: List[str] = Field(default_factory=list)
    github_url: Optional[str] = Field(None, max_length=500)
    live_url: Optional[str] = Field(None, max_length=500)

    class Config:
        extra = "forbid"   # Reject unknown fields — prevents mass assignment

    @validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        return _valid_slug(v)

    @validator("tags", each_item=True)
    @classmethod
    def validate_tags(cls, v) -> str:
        return str(v)[:100]


# ──────────────────────────────────────────────────────────────────
# Blog schemas
# ──────────────────────────────────────────────────────────────────

class BlogPostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    content: Optional[str] = Field(None, max_length=100_000)
    tags: List[str] = Field(default_factory=list)
    published: bool = Field(default=False)

    class Config:
        extra = "forbid"

    @validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        return _valid_slug(v)


# ──────────────────────────────────────────────────────────────────
# Lab schemas
# ──────────────────────────────────────────────────────────────────

class LabEntryCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    notes: Optional[str] = Field(None, max_length=10_000)
    category: Optional[str] = Field(None, max_length=100)

    class Config:
        extra = "forbid"


# ──────────────────────────────────────────────────────────────────
# Generic validator helper
# ──────────────────────────────────────────────────────────────────

@dataclass
class ValidationResult:
    data: Any       # The validated Pydantic model instance (or None on error)
    errors: list    # List of error dicts (empty on success)

    @property
    def ok(self) -> bool:
        return not self.errors


def validate(schema: type, data: dict) -> ValidationResult:
    """
    Validate a raw dict against a Pydantic v1 schema.

    Returns a ValidationResult where:
      - result.ok → True means validation passed
      - result.data → the validated model instance
      - result.errors → list of field-level error dicts for 422 responses
    """
    try:
        model = schema(**data)
        return ValidationResult(data=model, errors=[])
    except ValidationError as exc:
        errors = [
            {"field": ".".join(str(loc) for loc in e["loc"]), "msg": e["msg"]}
            for e in exc.errors()
        ]
        return ValidationResult(data=None, errors=errors)
