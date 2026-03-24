"""
app/routes/simulation_routes.py
─────────────────────────────────
Java simulation endpoints — invoke compiled Java engines via subprocess bridge.

Routes:
    POST /api/simulation/stack  → StackSimulator (5-step BOF)
    POST /api/simulation/heap   → HeapVisualizer (4-phase heap)
    POST /api/simulation/rop    → ROPChain       (6-step ROP)

Security:
    - sim_type validated against hard-coded allowlist in java_bridge
    - params validated here (integer step, string phase)
    - rate-limited: 30 req/min (educational use)
"""
import logging

from flask import Blueprint, jsonify, request

from app.extensions import limiter

logger = logging.getLogger(__name__)
simulation_bp = Blueprint("simulation_bp", __name__)

RATE_SIM = "30 per minute"

# Valid params per simulation type
VALID_TYPES = {
    "stack": {"param": "step",  "type": int,  "min": 1, "max": 5,     "default": 1},
    "heap":  {"param": "phase", "type": str,  "choices": ["alloc", "free", "spray", "uaf"], "default": "alloc"},
    "rop":   {"param": "step",  "type": int,  "min": 1, "max": 6,     "default": 1},
}


def _parse_params(sim_type: str, body: dict) -> dict:
    """
    Validate and extract simulation parameters from request body.
    Returns a clean params dict or raises ValueError.
    """
    spec = VALID_TYPES[sim_type]
    param_name = spec["param"]

    if spec["type"] == int:
        raw = body.get(param_name, spec["default"])
        try:
            val = int(raw)
        except (TypeError, ValueError):
            raise ValueError(f"'{param_name}' must be an integer.")
        if not (spec["min"] <= val <= spec["max"]):
            raise ValueError(
                f"'{param_name}' must be between {spec['min']} and {spec['max']}."
            )
        return {param_name: val}

    else:  # str with choices
        val = body.get(param_name, spec["default"])
        if val not in spec["choices"]:
            raise ValueError(
                f"'{param_name}' must be one of: {spec['choices']}."
            )
        return {param_name: val}


@simulation_bp.route("/simulation/<string:sim_type>", methods=["POST"])
@limiter.limit(RATE_SIM)
def run_simulation(sim_type: str):
    """
    POST /api/simulation/<sim_type>
    Body (JSON, optional):
        stack → {"step": 1..5}
        heap  → {"phase": "alloc|free|spray|uaf"}
        rop   → {"step": 1..6}

    Returns:
        200 + simulation JSON from Java engine
        400 + error message for invalid params or unknown sim_type
        500 + safe error message for Java failures
    """
    if sim_type not in VALID_TYPES:
        return jsonify({
            "error": f"Unknown simulation '{sim_type}'. "
                     f"Available: {list(VALID_TYPES.keys())}"
        }), 400

    body = {}
    if request.content_length and request.content_type == "application/json":
        body = request.get_json(silent=True) or {}

    # Validate params
    try:
        params = _parse_params(sim_type, body)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    # Run Java bridge
    try:
        from app.java.java_bridge import run_simulation as _run
        result = _run(sim_type, params)
        return jsonify(result), 200

    except TimeoutError:
        return jsonify({"error": "Simulation timed out. Please try again."}), 503

    except (ValueError, FileNotFoundError) as exc:
        return jsonify({"error": str(exc)}), 400

    except Exception as exc:
        logger.error(f"Simulation bridge error: {exc}", exc_info=True)
        return jsonify({"error": "Simulation engine error. Check server logs."}), 500
