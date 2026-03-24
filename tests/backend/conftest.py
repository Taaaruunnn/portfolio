"""
tests/backend/conftest.py
──────────────────────────
pytest fixtures shared across all backend tests.
"""
import pytest
from app import create_app
from app.extensions import db as _db


@pytest.fixture(scope="session")
def app():
    """Create the Flask test app (in-memory SQLite, CSRF/rate limits off)."""
    application = create_app("testing")
    return application


@pytest.fixture(scope="session")
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture(scope="function", autouse=True)
def reset_db(app):
    """
    Reset the database between tests.
    Creates all tables before each test and drops them after.
    """
    with app.app_context():
        _db.create_all()
        yield
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def admin_headers():
    """Headers with valid admin token (from TestingConfig)."""
    return {"X-Admin-Token": "test-admin-token-do-not-use-in-prod",
            "Content-Type": "application/json"}


@pytest.fixture
def no_auth_headers():
    """Headers without admin token — for 401 tests."""
    return {"Content-Type": "application/json"}
