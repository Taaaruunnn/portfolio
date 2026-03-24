"""
app/routes/blog_routes.py
──────────────────────────
Public read-only endpoints for blog posts.

GET /api/blog        → paginated list of PUBLISHED posts
GET /api/blog/<slug> → single post (published only)
"""
from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models.blog_model import BlogPost
from app.utils.helpers import paginate, safe_int
from app.utils.constants import DEFAULT_PAGE_SIZE

blog_bp = Blueprint("blog_bp", __name__)


@blog_bp.route("/blog", methods=["GET"])
def list_posts():
    """
    GET /api/blog
    Returns only published posts. Unpublished posts are invisible to public.
    Query params:
        ?page=1, ?per_page=20, ?tag=<tag>
    """
    page = safe_int(request.args.get("page"), default=1)
    per_page = safe_int(request.args.get("per_page"), default=DEFAULT_PAGE_SIZE)
    tag_filter = request.args.get("tag", "").strip()

    query = (
        db.select(BlogPost)
        .where(BlogPost.published == True)  # noqa: E712 — SQLAlchemy requires == True
        .order_by(BlogPost.created_at.desc())
    )

    if tag_filter:
        query = query.where(BlogPost._tags.like(f"%{tag_filter}%"))

    result = paginate(query, page, per_page)

    # Strip content for list endpoint (bandwidth saving)
    # Rebuild items using include_content=False serializer
    from app.models.blog_model import BlogPost as BP
    posts = db.session.execute(query).scalars().all()
    # Re-paginate manually for content control (use scalar list)
    page_val = max(1, page)
    per_page_val = min(per_page, 100)
    total = db.session.execute(db.select(db.func.count()).select_from(query.subquery())).scalar()
    start = (page_val - 1) * per_page_val
    paged = db.session.execute(query.offset(start).limit(per_page_val)).scalars().all()
    result = {
        "items": [p.to_dict(include_content=False) for p in paged],
        "page": page_val,
        "per_page": per_page_val,
        "total": total,
        "pages": max(1, (total + per_page_val - 1) // per_page_val),
    }

    return jsonify(result), 200


@blog_bp.route("/blog/<string:slug>", methods=["GET"])
def get_post(slug: str):
    """
    GET /api/blog/<slug>
    Returns a single published post with full content, or 404.
    """
    post = db.session.execute(
        db.select(BlogPost).where(
            BlogPost.slug == slug,
            BlogPost.published == True,  # noqa: E712
        )
    ).scalar_one_or_none()

    if not post:
        return jsonify({"error": "Post not found."}), 404

    return jsonify(post.to_dict(include_content=True)), 200
