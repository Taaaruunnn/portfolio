"""
app/services/file_service.py
─────────────────────────────
Secure file upload handler.

Security measures applied (in order):
  1. Extension whitelist check
  2. MIME magic-bytes check (independent of extension)
  3. File size cap (from MAX_UPLOAD_MB env var)
  4. UUID rename (no path traversal possible; original name stored in DB only)
  5. Files saved to uploads/ which is NOT in the web root

Returns a dict with {file_id, original_name} on success.
Raises ValueError with a safe, client-facing message on failure.
"""
import uuid
import logging
from pathlib import Path

import filetype
from flask import current_app
from werkzeug.datastructures import FileStorage

from app.utils.constants import ALLOWED_EXTENSIONS, ALLOWED_MIMES, MAX_UPLOAD_BYTES

logger = logging.getLogger(__name__)


def save_upload(file: FileStorage) -> dict:
    """
    Validate and save an uploaded file securely.

    Args:
        file: Werkzeug FileStorage object from request.files.

    Returns:
        {"file_id": str, "original_name": str}

    Raises:
        ValueError: with a client-safe error message if validation fails.
    """
    if not file or not file.filename:
        raise ValueError("No file provided.")

    original_name = file.filename
    suffix = Path(original_name).suffix.lower()

    # ── 1. Extension whitelist ─────────────────────────────────────
    if suffix not in ALLOWED_EXTENSIONS:
        logger.warning(f"FILE UPLOAD: Rejected extension '{suffix}' for '{original_name}'")
        raise ValueError(
            f"File type '{suffix}' is not allowed. "
            f"Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # ── 2. Read into memory for MIME check + size check ───────────
    file_bytes = file.read()

    # ── 3. File size cap ──────────────────────────────────────────
    max_bytes = current_app.config.get("MAX_CONTENT_LENGTH", MAX_UPLOAD_BYTES)
    if len(file_bytes) > max_bytes:
        mb = max_bytes // (1024 * 1024)
        raise ValueError(f"File exceeds maximum size of {mb} MB.")

    if len(file_bytes) == 0:
        raise ValueError("Uploaded file is empty.")

    # ── 4. MIME type check (magic bytes) ──────────────────────────
    # Plain text files (.txt, .md) have no magic bytes — filetype returns None.
    # We allow None only for known plain-text extensions.
    # Binary files (PDF, PNG, JPEG) must match a known MIME signature.
    MAGIC_EXEMPT_EXTENSIONS = {".txt", ".md"}

    detected = filetype.guess(file_bytes)
    detected_mime = detected.mime if detected else None

    if detected_mime is None:
        # No magic bytes detected
        if suffix not in MAGIC_EXEMPT_EXTENSIONS:
            # Binary extension but no recognisable magic bytes — reject
            logger.warning(
                f"FILE UPLOAD: No magic bytes for binary extension. "
                f"ext={suffix} name='{original_name}'"
            )
            raise ValueError("File content could not be verified. Upload rejected.")
        # Plain text extension with no magic bytes — acceptable, continue
    elif detected_mime not in ALLOWED_MIMES:
        # Magic bytes present but not in the allowed MIME whitelist — reject
        logger.warning(
            f"FILE UPLOAD: MIME mismatch. "
            f"ext={suffix} detected_mime={detected_mime} name='{original_name}'"
        )
        raise ValueError("File content does not match its declared type.")

    # ── 5. UUID rename and save ────────────────────────────────────
    file_id = str(uuid.uuid4())
    safe_filename = file_id + suffix

    uploads_dir = Path(current_app.root_path).parent / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    dest_path = uploads_dir / safe_filename
    dest_path.write_bytes(file_bytes)

    logger.info(
        f"FILE UPLOAD: Saved '{original_name}' → '{safe_filename}' "
        f"({len(file_bytes)} bytes)"
    )

    return {"file_id": file_id, "original_name": original_name}


def delete_upload(file_id: str, extension: str) -> bool:
    """
    Delete an upload by its UUID file_id and extension.
    Returns True if deleted, False if not found.

    extension must come from the DB record — never from user input.
    """
    if not file_id or not extension:
        return False

    # Sanitize: extension must be in the whitelist
    if extension.lower() not in ALLOWED_EXTENSIONS:
        logger.warning(f"FILE DELETE: Rejected unknown extension '{extension}'")
        return False

    uploads_dir = Path(current_app.root_path).parent / "uploads"
    target = uploads_dir / (file_id + extension.lower())

    if target.exists():
        target.unlink()
        logger.info(f"FILE DELETE: Removed '{target.name}'")
        return True

    logger.warning(f"FILE DELETE: Not found — '{target.name}'")
    return False
