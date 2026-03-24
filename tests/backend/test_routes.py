"""
tests/backend/test_routes.py
──────────────────────────────
Tests for public read-only endpoints.
All tests use an in-memory SQLite DB that is reset between each test.
"""
import json
import pytest


class TestHealthRoutes:
    def test_health_returns_200(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_health_returns_json_with_status(self, client):
        data = response = client.get("/api/health").get_json()
        assert data["status"] == "ok"
        assert "ts" in data
        assert "version" in data

    def test_meta_returns_200(self, client):
        response = client.get("/api/meta")
        assert response.status_code == 200

    def test_meta_contains_title(self, client):
        data = client.get("/api/meta").get_json()
        assert "title" in data


class TestProjectRoutes:
    def test_list_projects_empty(self, client):
        """Empty DB should return an empty items list, not a 500."""
        response = client.get("/api/projects")
        assert response.status_code == 200
        data = response.get_json()
        assert data["items"] == []

    def test_get_project_not_found(self, client):
        response = client.get("/api/projects/nonexistent-slug")
        assert response.status_code == 404

    def test_create_and_retrieve_project(self, client, admin_headers):
        """Admin creates a project; public endpoint returns it."""
        payload = {
            "title": "Buffer Overflow Demo",
            "slug": "buffer-overflow-demo",
            "description": "A live buffer overflow demonstration.",
            "tags": ["binary-exploitation", "c"],
        }
        create_response = client.post(
            "/api/admin/project",
            data=json.dumps(payload),
            headers=admin_headers,
        )
        assert create_response.status_code == 201

        list_response = client.get("/api/projects")
        assert list_response.status_code == 200
        items = list_response.get_json()["items"]
        assert len(items) == 1
        assert items[0]["slug"] == "buffer-overflow-demo"


class TestBlogRoutes:
    def test_list_posts_empty(self, client):
        response = client.get("/api/blog")
        assert response.status_code == 200
        assert response.get_json()["items"] == []

    def test_unpublished_post_not_visible(self, client, admin_headers):
        """Draft posts should NOT appear on public blog list."""
        payload = {
            "title": "Draft Post",
            "slug": "draft-post",
            "content": "Still writing...",
            "published": False,
        }
        client.post("/api/admin/blog", data=json.dumps(payload), headers=admin_headers)
        response = client.get("/api/blog")
        assert response.get_json()["items"] == []

    def test_published_post_visible(self, client, admin_headers):
        payload = {
            "title": "Published Post",
            "slug": "published-post",
            "content": "# Hello",
            "published": True,
        }
        client.post("/api/admin/blog", data=json.dumps(payload), headers=admin_headers)
        response = client.get("/api/blog")
        assert len(response.get_json()["items"]) == 1


class TestLabRoutes:
    def test_list_lab_entries_empty(self, client):
        response = client.get("/api/lab")
        assert response.status_code == 200
        assert response.get_json()["total"] == 0

    def test_rag_returns_200_with_answer(self, client):
        """RAG endpoint (Phase 4) should return 200 with answer, sources, confidence."""
        response = client.post(
            "/api/rag/query",
            data=json.dumps({"question": "What is SQL injection?"}),
            content_type="application/json",
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "answer" in data
        assert "sources" in data
        assert "confidence" in data
        assert "method" in data
        assert data["method"] in ("bm25", "openai")
        assert isinstance(data["sources"], list)

    def test_simulation_returns_200_with_data(self, client):
        """Simulation endpoint (Phase 6) should return 200 with JSON from Java engine."""
        response = client.post("/api/simulation/stack")
        assert response.status_code == 200
        data = response.get_json()
        assert "type" in data
        assert data["type"] == "stack_bof"
        assert "step" in data
        assert "total_steps" in data
        assert isinstance(data.get("memory_map", []), list)
