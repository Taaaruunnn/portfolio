# CyberSec Portfolio

A comprehensive, full-stack Cybersecurity Portfolio and interactive AI-driven application. This project features a modern React frontend and a secure Python backend.

## Tech Stack

### Frontend
- **React 19** with **Vite**
- **React Router Dom** for client-side routing
- **Framer Motion** for smooth, modern animations
- **Axios** for API requests, with **DOMPurify** and **Marked** for secure markdown rendering
- Testing via **Vitest** and **React Testing Library**

### Backend
- **Flask 3+** for routing and RESTful APIs
- **SQLAlchemy** & **Flask-Migrate** for robust database management
- **Security**: Flask-WTF, Flask-Limiter, Flask-CORS, and Bleach to sanitize data.
- **AI & RAG**: `rank-bm25` and `numpy` for sparse and dense retrieval algorithms.
- **Pytest** for testing the backend configuration

## Directory Structure

- `/frontend` - Contains the React + Vite frontend application.
- `/backend` - Contains the Flask Python backend server.
- `/tests` - Contains comprehensive end-to-end and security tests.
- `/java-modules` - Java dependencies or complementary modules for the application ecosystem.

## Getting Started

### Prerequisites
- Node.js (for frontend)
- Python 3.10+ (for backend)

### Running the Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```bash
   python run.py
   ```

### Running the Frontend

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```

### Testing

Tests are managed primarily inside the backend via `pytest` and frontend via `vitest`.
There is also a shared `tests/` directory at the root for end-to-end / general testing.

To run the backend tests:
```bash
pytest backend/
```
