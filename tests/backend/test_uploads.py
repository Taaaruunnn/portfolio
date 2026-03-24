"""
tests/backend/test_uploads.py
───────────────────────────────
File upload security tests.
Verifies that malicious or invalid uploads are rejected at each layer.
"""
import io
import pytest


def _make_upload(filename: str, content: bytes, field_name: str = "file"):
    """Helper: create a multipart upload request for the test client."""
    return {
        field_name: (io.BytesIO(content), filename),
        "title": "Test Entry",
    }


class TestFileUploadValidation:
    UPLOAD_URL = "/api/lab/upload"

    def test_valid_text_file_accepted(self, client):
        """A valid plain-text .txt file should be accepted (201)."""
        data = _make_upload("notes.txt", b"Some lab notes here.")
        response = client.post(
            self.UPLOAD_URL,
            data=data,
            content_type="multipart/form-data",
        )
        assert response.status_code == 201
        result = response.get_json()
        assert "file_id" in result
        assert result["file_name"] == "notes.txt"

    def test_executable_rejected(self, client):
        """A .exe upload must be rejected with 400."""
        data = _make_upload("malware.exe", b"MZ\x90\x00")  # PE magic bytes
        response = client.post(
            self.UPLOAD_URL,
            data=data,
            content_type="multipart/form-data",
        )
        assert response.status_code == 400
        assert "error" in response.get_json()

    def test_double_extension_rejected(self, client):
        """A .pdf.exe double extension must be rejected."""
        data = _make_upload("evil.pdf.exe", b"MZ\x90\x00")
        response = client.post(
            self.UPLOAD_URL,
            data=data,
            content_type="multipart/form-data",
        )
        assert response.status_code == 400

    def test_empty_file_rejected(self, client):
        """An empty file must be rejected."""
        data = _make_upload("empty.txt", b"")
        response = client.post(
            self.UPLOAD_URL,
            data=data,
            content_type="multipart/form-data",
        )
        assert response.status_code == 400

    def test_no_file_field_returns_400(self, client):
        """Request without a file field must return 400."""
        response = client.post(
            self.UPLOAD_URL,
            data={"title": "Missing file"},
            content_type="multipart/form-data",
        )
        assert response.status_code == 400

    def test_missing_title_returns_400(self, client):
        """Upload without a title should be rejected."""
        response = client.post(
            self.UPLOAD_URL,
            data={"file": (io.BytesIO(b"data"), "test.txt")},
            content_type="multipart/form-data",
        )
        assert response.status_code == 400

    def test_script_in_filename_handled_safely(self, client):
        """Script-tagged filename should not cause a server error."""
        data = _make_upload("<script>alert(1)</script>.txt", b"safe content")
        response = client.post(
            self.UPLOAD_URL,
            data=data,
            content_type="multipart/form-data",
        )
        # Either accepted (stripped) or rejected — must not be 500
        assert response.status_code in (201, 400)
        assert response.status_code != 500
