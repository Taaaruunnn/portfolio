"""
app/routes/lab_routes.py
─────────────────────────
Endpoints for the lab notebook.

GET  /api/lab         → List all lab entries
POST /api/lab/upload  → Upload a file attachment (validated)
"""
from flask import Blueprint, jsonify, request, current_app

from app.extensions import db, limiter
from app.models.lab_model import LabEntry
from app.services.file_service import save_upload
from app.security.input_sanitizer import sanitize_string
from app.utils.constants import RATE_UPLOAD

lab_bp = Blueprint("lab_bp", __name__)


@lab_bp.route("/lab", methods=["GET"])
def list_lab_entries():
    """
    GET /api/lab
    Returns all lab entries ordered by created_at descending.
    """
    entries = db.session.execute(
        db.select(LabEntry).order_by(LabEntry.created_at.desc())
    ).scalars().all()

    return jsonify({"items": [e.to_dict() for e in entries], "total": len(entries)}), 200


@lab_bp.route("/lab/upload", methods=["POST"])
@limiter.limit(RATE_UPLOAD)
def upload_file():
    """
    POST /api/lab/upload
    multipart/form-data fields:
        file     — required, the file to upload
        title    — required, lab entry title
        notes    — optional
        category — optional
    """
    # Validate file presence
    if "file" not in request.files:
        return jsonify({"error": "No file field in request."}), 400

    uploaded_file = request.files["file"]

    # Sanitize text fields from form data
    title = sanitize_string(request.form.get("title", "").strip())
    notes = sanitize_string(request.form.get("notes", "").strip())
    category = sanitize_string(request.form.get("category", "").strip())

    if not title:
        return jsonify({"error": "Title is required."}), 400

    # Secure file handling — raises ValueError on validation failure
    try:
        file_info = save_upload(uploaded_file)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    # Create lab entry with file reference
    entry = LabEntry(
        title=title,
        notes=notes or None,
        category=category or None,
        file_id=file_info["file_id"],
        file_name=file_info["original_name"],
    )
    db.session.add(entry)
    db.session.commit()

    current_app.logger.info(f"LAB: New entry created — id={entry.id} title={title!r}")
    return jsonify(entry.to_dict()), 201
