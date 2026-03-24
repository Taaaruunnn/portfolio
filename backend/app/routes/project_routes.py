"""
app/routes/project_routes.py
──────────────────────────────
Public read-only endpoints for portfolio projects.

GET /api/projects        → paginated list, filterable by ?tag=
GET /api/projects/<slug> → single project by slug
"""
from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models.project_model import Project
from app.utils.helpers import paginate, safe_int
from app.utils.constants import DEFAULT_PAGE_SIZE

project_bp = Blueprint("project_bp", __name__)


@project_bp.route("/projects", methods=["GET"])
def list_projects():
    """
    GET /api/projects
    Query params:
        ?page=1       (default: 1)
        ?per_page=20  (default: 20, max: 100)
        ?tag=security (optional: filter by tag substring)
    """
    page = safe_int(request.args.get("page"), default=1)
    per_page = safe_int(request.args.get("per_page"), default=DEFAULT_PAGE_SIZE)
    tag_filter = request.args.get("tag", "").strip()

    query = db.select(Project).order_by(Project.created_at.desc())

    if tag_filter:
        # SQLite JSON stored as text — substring match is sufficient for filtering
        query = query.where(Project._tags.like(f"%{tag_filter}%"))

    result = paginate(query, page, per_page)
    return jsonify(result), 200


@project_bp.route("/projects/<string:slug>", methods=["GET"])
def get_project(slug: str):
    """
    GET /api/projects/<slug>
    Returns a single project or 404.
    """
    project = db.session.execute(
        db.select(Project).where(Project.slug == slug)
    ).scalar_one_or_none()

    if not project:
        return jsonify({"error": "Project not found."}), 404

    return jsonify(project.to_dict()), 200
