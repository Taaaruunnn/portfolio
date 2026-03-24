"""
tests/backend/test_security_headers.py
────────────────────────────────────────
Tests for Phase 5 security header additions:
  - X-Request-ID (UUID4, unique per request)
  - CSP tightening (base-uri, form-action)
  - CORS expose headers
  - Existing security headers (spot checks)
"""
import re
import pytest

UUID4_PATTERN = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    re.IGNORECASE,
)


class TestRequestIDHeader:
    """X-Request-ID generated per request."""

    def test_x_request_id_present_on_200(self, client):
        """Every 200 response must carry an X-Request-ID header."""
        res = client.get("/api/health")
        assert res.status_code == 200
        assert "X-Request-ID" in res.headers

    def test_x_request_id_is_valid_uuid4(self, client):
        """X-Request-ID must be a valid UUID4."""
        res = client.get("/api/health")
        rid = res.headers["X-Request-ID"]
        assert UUID4_PATTERN.match(rid), f"Not a UUID4: {rid}"

    def test_x_request_id_present_on_404(self, client):
        """X-Request-ID should be present even on 404 responses."""
        res = client.get("/api/projects/nonexistent")
        assert "X-Request-ID" in res.headers

    def test_x_request_id_present_on_422(self, client):
        """X-Request-ID should be present on validation error responses."""
        res = client.post(
            "/api/admin/project",
            json={"title": "", "slug": ""},
            headers={"X-Admin-Token": "test-admin-token-do-not-use-in-prod"},
        )
        assert "X-Request-ID" in res.headers

    def test_x_request_id_unique_per_request(self, client):
        """Two sequential requests must have different X-Request-IDs."""
        rid1 = client.get("/api/health").headers["X-Request-ID"]
        rid2 = client.get("/api/health").headers["X-Request-ID"]
        assert rid1 != rid2, "Request IDs should be unique per request"


class TestCSPHeader:
    """Content-Security-Policy hardening (Phase 5)."""

    def _get_csp(self, client):
        return client.get("/api/health").headers.get("Content-Security-Policy", "")

    def test_csp_default_src_none(self, client):
        """CSP must include default-src 'none'."""
        csp = self._get_csp(client)
        assert "default-src 'none'" in csp

    def test_csp_frame_ancestors_none(self, client):
        """CSP must block all framing."""
        csp = self._get_csp(client)
        assert "frame-ancestors 'none'" in csp

    def test_csp_base_uri_none(self, client):
        """CSP must include base-uri 'none' (Phase 5 hardening)."""
        csp = self._get_csp(client)
        assert "base-uri 'none'" in csp

    def test_csp_form_action_none(self, client):
        """CSP must include form-action 'none' (Phase 5 hardening)."""
        csp = self._get_csp(client)
        assert "form-action 'none'" in csp


class TestOtherSecurityHeaders:
    """Spot-check remaining security headers."""

    def test_x_frame_options_deny(self, client):
        res = client.get("/api/health")
        assert res.headers.get("X-Frame-Options") == "DENY"

    def test_x_content_type_options_nosniff(self, client):
        res = client.get("/api/health")
        assert res.headers.get("X-Content-Type-Options") == "nosniff"

    def test_referrer_policy_set(self, client):
        res = client.get("/api/health")
        assert "Referrer-Policy" in res.headers

    def test_permissions_policy_disables_geo(self, client):
        res = client.get("/api/health")
        pp = res.headers.get("Permissions-Policy", "")
        assert "geolocation=()" in pp

    def test_server_header_not_werkzeug(self, client):
        res = client.get("/api/health")
        server = res.headers.get("Server", "")
        assert "Werkzeug" not in server
        assert "Python" not in server
