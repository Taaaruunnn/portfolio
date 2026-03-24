"""
app/routes/admin_routes.py
───────────────────────────
Admin write endpoints — PROTECTED by X-Admin-Token header.
All routes require token authentication via @require_admin_token.
Rate-limited to 20 req/min. All actions are logged.

Routes:
    POST   /api/admin/project        → Create a project
    DELETE /api/admin/project/<id>   → Delete a project
    POST   /api/admin/blog           → Create a blog post
    DELETE /api/admin/blog/<id>      → Delete a blog post
"""
import logging

from flask import Blueprint, jsonify, request, current_app
from sqlalchemy.exc import IntegrityError

from app.extensions import db, limiter
from app.models.project_model import Project
from app.models.blog_model import BlogPost
from app.services.security_service import require_admin_token
from app.services.validation_service import (
    ProjectCreate,
    BlogPostCreate,
    validate,
)
from app.services.logging_service import log_admin_action
from app.security.input_sanitizer import sanitize_request_json
from app.utils.constants import RATE_ADMIN

logger = logging.getLogger(__name__)
admin_bp = Blueprint("admin_bp", __name__)


# ──────────────────────────────────────────────────────────────────
# Projects
# ──────────────────────────────────────────────────────────────────

@admin_bp.route("/project", methods=["POST"])
@require_admin_token
@limiter.limit(RATE_ADMIN)
def create_project():
    """
    POST /api/admin/project
    Headers: X-Admin-Token: <token>
    Body (JSON):
        title       — required
        slug        — required, unique, alphanumeric + hyphens
        description — optional
        tags        — optional, list of strings
        github_url  — optional
        live_url    — optional
    """
    data = sanitize_request_json(request)
    result = validate(ProjectCreate, data)

    if not result.ok:
        return jsonify({"errors": result.errors}), 422

    project = Project(
        title=result.data.title,
        slug=result.data.slug,
        description=result.data.description,
        github_url=result.data.github_url,
        live_url=result.data.live_url,
    )
    project.tags = result.data.tags

    try:
        db.session.add(project)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": f"Slug '{result.data.slug}' already exists."}), 409

    log_admin_action("CREATE_PROJECT", detail=project.slug)
    return jsonify(project.to_dict()), 201


@admin_bp.route("/project/<int:project_id>", methods=["DELETE"])
@require_admin_token
@limiter.limit(RATE_ADMIN)
def delete_project(project_id: int):
    """
    DELETE /api/admin/project/<id>
    Headers: X-Admin-Token: <token>
    """
    project = db.session.get(Project, project_id)
    if not project:
        return jsonify({"error": "Project not found."}), 404

    slug = project.slug
    db.session.delete(project)
    db.session.commit()

    log_admin_action("DELETE_PROJECT", detail=f"id={project_id} slug={slug}")
    return jsonify({"message": f"Project '{slug}' deleted."}), 200


# ──────────────────────────────────────────────────────────────────
# Blog posts
# ──────────────────────────────────────────────────────────────────

@admin_bp.route("/blog", methods=["POST"])
@require_admin_token
@limiter.limit(RATE_ADMIN)
def create_blog_post():
    """
    POST /api/admin/blog
    Headers: X-Admin-Token: <token>
    Body (JSON):
        title     — required
        slug      — required, unique
        content   — optional (Markdown)
        tags      — optional
        published — optional (default: false)
    """
    data = sanitize_request_json(request)
    result = validate(BlogPostCreate, data)

    if not result.ok:
        return jsonify({"errors": result.errors}), 422

    post = BlogPost(
        title=result.data.title,
        slug=result.data.slug,
        content=result.data.content,
        published=result.data.published,
    )
    post.tags = result.data.tags

    try:
        db.session.add(post)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": f"Slug '{result.data.slug}' already exists."}), 409

    log_admin_action("CREATE_BLOG", detail=post.slug)
    return jsonify(post.to_dict()), 201


@admin_bp.route("/blog/<int:post_id>", methods=["DELETE"])
@require_admin_token
@limiter.limit(RATE_ADMIN)
def delete_blog_post(post_id: int):
    """
    DELETE /api/admin/blog/<id>
    Headers: X-Admin-Token: <token>
    """
    post = db.session.get(BlogPost, post_id)
    if not post:
        return jsonify({"error": "Post not found."}), 404

    slug = post.slug
    db.session.delete(post)
    db.session.commit()

    log_admin_action("DELETE_BLOG", detail=f"id={post_id} slug={slug}")
    return jsonify({"message": f"Post '{slug}' deleted."}), 200
