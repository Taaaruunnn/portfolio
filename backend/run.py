"""
backend/run.py
───────────────
Development entry point.

Auto-detects OS:
  - Windows → Waitress (gunicorn doesn't run on Windows)
  - Linux/macOS → Waitress also acceptable; gunicorn is recommended via CLI

Production (Linux):
    gunicorn -c deployment/gunicorn.conf.py "run:app"

Development (Windows or any OS):
    python run.py

Usage: always run from the `backend/` directory with venv activated.
"""
import os
import sys
import platform
from pathlib import Path

# Ensure the backend directory is on the Python path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from app import create_app

flask_env = os.getenv("FLASK_ENV", "development")
app = create_app(flask_env)

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5000"))
    os_name = platform.system()

    print(f"\n{'='*55}")
    print(f"  Cybersecurity Portfolio – Backend")
    print(f"  Environment : {flask_env}")
    print(f"  Platform    : {os_name}")
    print(f"  Address     : http://{host}:{port}")
    print(f"{'='*55}\n")

    if os_name == "Windows" or flask_env == "testing":
        # Waitress: production-grade WSGI server, Windows-compatible
        try:
            from waitress import serve
            print(f"  Server      : Waitress")
            print(f"{'='*55}\n")
            serve(app, host=host, port=port, threads=4)
        except ImportError:
            print("[ERROR] waitress is not installed. Run: pip install waitress")
            sys.exit(1)
    else:
        # Linux/macOS dev — Flask built-in (gunicorn via CLI for prod)
        print(f"  Server      : Flask dev (use gunicorn for prod)")
        print(f"{'='*55}\n")
        app.run(host=host, port=port, debug=(flask_env == "development"))
