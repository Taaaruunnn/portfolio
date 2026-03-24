"""
cybersec-portfolio/conftest.py (root-level)
────────────────────────────────────────────
Adds the backend/ directory to sys.path so that pytest can import
the `app` package regardless of which directory pytest is launched from.
"""
import sys
from pathlib import Path

# Add backend/ to sys.path
backend_dir = Path(__file__).parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
