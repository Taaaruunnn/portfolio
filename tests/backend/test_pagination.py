"""
tests/backend/test_pagination.py
──────────────────────────────────
Tests for pagination, tag filtering, and response envelope shape
on the project and blog list endpoints.

Each test creates its own data inline using the admin API or direct DB calls.
"""
import pytest
from app.extensions import db
from app.models.project_model import Project
from app.models.blog_model import BlogPost


ADMIN_TOKEN = "test-admin-token-do-not-use-in-prod"
ADMIN_HEADERS = {"X-Admin-Token": ADMIN_TOKEN}


def _create_project(client, title, slug, tags=None):
    """Helper: create a project via admin API."""
    payload = {"title": title, "slug": slug, "description": f"Desc for {title}"}
    if tags:
        payload["tags"] = tags
    res = client.post("/api/admin/project", json=payload, headers=ADMIN_HEADERS)
    assert res.status_code == 201, f"Failed to create project: {res.get_json()}"
    return res.get_json()


def _create_post(client, title, slug, published=True, tags=None):
    """Helper: create a blog post via admin API."""
    payload = {
        "title": title,
        "slug": slug,
        "content": f"# {title}\nContent here.",
        "published": published,
    }
    if tags:
        payload["tags"] = tags
    res = client.post("/api/admin/blog", json=payload, headers=ADMIN_HEADERS)
    assert res.status_code == 201, f"Failed to create post: {res.get_json()}"
    return res.get_json()


class TestProjectPagination:
    """Pagination and filtering for GET /api/projects."""

    def test_response_envelope_has_required_fields(self, client):
        """Empty list response must still have items/page/per_page/total."""
        data = client.get("/api/projects").get_json()
        assert "items"    in data
        assert "page"     in data
        assert "per_page" in data
        assert "total"    in data

    def test_page1_returns_correct_count(self, client):
        """First page should return up to per_page items."""
        for i in range(5):
            _create_project(client, f"Project {i}", f"project-{i}")
        data = client.get("/api/projects?per_page=3").get_json()
        assert len(data["items"]) == 3
        assert data["page"] == 1
        assert data["per_page"] == 3
        assert data["total"] == 5

    def test_page2_returns_remainder(self, client):
        """Second page should return the remaining items."""
        for i in range(5):
            _create_project(client, f"Proj {i}", f"proj-{i}")
        data = client.get("/api/projects?per_page=3&page=2").get_json()
        assert len(data["items"]) == 2
        assert data["page"] == 2

    def test_per_page_clamped_to_max_100(self, client):
        """per_page=9999 should be silently clamped to 100."""
        data = client.get("/api/projects?per_page=9999").get_json()
        assert data["per_page"] <= 100

    def test_tag_filter_returns_subset(self, client):
        """?tag=python should only return projects tagged python."""
        _create_project(client, "Python Project", "python-proj", tags=["python", "flask"])
        _create_project(client, "Go Project",     "go-proj",     tags=["go"])
        data = client.get("/api/projects?tag=python").get_json()
        slugs = [p["slug"] for p in data["items"]]
        assert "python-proj" in slugs
        assert "go-proj" not in slugs

    def test_tag_filter_no_match_returns_empty(self, client):
        """?tag=nonexistent should return empty items, not 404."""
        _create_project(client, "Some Project", "some-proj", tags=["rust"])
        data = client.get("/api/projects?tag=nonexistent").get_json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_out_of_range_page_returns_empty_items(self, client):
        """Page beyond total pages should return empty items (not 404)."""
        _create_project(client, "Solo Project", "solo-proj")
        data = client.get("/api/projects?page=999").get_json()
        assert data["items"] == []

    def test_items_ordered_newest_first(self, client):
        """Projects should be returned newest-first."""
        _create_project(client, "First",  "first-proj")
        _create_project(client, "Second", "second-proj")
        _create_project(client, "Third",  "third-proj")
        data = client.get("/api/projects").get_json()
        slugs = [p["slug"] for p in data["items"]]
        assert slugs.index("third-proj") < slugs.index("first-proj")


class TestBlogPagination:
    """Pagination and published-status filtering for GET /api/blog."""

    def test_blog_envelope_has_required_fields(self, client):
        data = client.get("/api/blog").get_json()
        assert "items"    in data
        assert "page"     in data
        assert "per_page" in data
        assert "total"    in data

    def test_unpublished_posts_hidden_in_list(self, client):
        """published=False posts must not appear in GET /api/blog."""
        _create_post(client, "Private Draft",   "private-draft",   published=False)
        _create_post(client, "Published Post",  "published-post",  published=True)
        data = client.get("/api/blog").get_json()
        slugs = [p["slug"] for p in data["items"]]
        assert "private-draft"  not in slugs
        assert "published-post" in slugs

    def test_blog_pagination_page1(self, client):
        """Create 3 posts, per_page=2 → page 1 has 2 items."""
        for i in range(3):
            _create_post(client, f"Post {i}", f"post-pg-{i}")
        data = client.get("/api/blog?per_page=2").get_json()
        assert len(data["items"]) == 2
        assert data["total"] >= 3

    def test_get_post_by_slug_found(self, client):
        """GET /api/blog/:slug returns correct post."""
        _create_post(client, "Slug Test Post", "slug-test-post")
        res = client.get("/api/blog/slug-test-post")
        assert res.status_code == 200
        data = res.get_json()
        assert data["slug"]  == "slug-test-post"
        assert data["title"] == "Slug Test Post"

    def test_get_post_by_slug_not_found(self, client):
        """GET /api/blog/nonexistent → 404."""
        res = client.get("/api/blog/no-such-post")
        assert res.status_code == 404

    def test_blog_items_ordered_newest_first(self, client):
        """Blog posts should be returned newest-first."""
        _create_post(client, "Oldest", "oldest-post")
        _create_post(client, "Newest", "newest-post")
        data = client.get("/api/blog").get_json()
        slugs = [p["slug"] for p in data["items"]]
        assert slugs.index("newest-post") < slugs.index("oldest-post")
