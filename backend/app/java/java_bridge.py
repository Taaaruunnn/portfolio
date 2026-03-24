"""
app/java/java_bridge.py
────────────────────────
Python subprocess bridge to Java 25 simulation engines.

Protocol:
  java -cp <classpath> <ClassName> '<json_args>'

IPC: Java prints a single JSON object to stdout.
     Python reads it, parses it, returns a dict.

Security:
  - Hard-coded class allowlist (CLASS_MAP) — no user-supplied class names
  - shell=False — no shell injection
  - JSON-encoded args — no string interpolation
  - 5-second timeout — kills hung processes
"""
import json
import logging
import os
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────
_HERE = Path(__file__).parent               # backend/app/java/
_JAVA_MODULES = _HERE.parents[2] / "java-modules"  # project root / java-modules

# ── Class allowlist ───────────────────────────────────────────────
# ONLY these classes can be invoked through the bridge.
CLASS_MAP = {
    "stack": "StackSimulator",
    "heap":  "HeapVisualizer",
    "rop":   "ROPChain",
}

_COMPILED: set = set()   # track which classes have been compiled this session


def _ensure_compiled(class_name: str) -> None:
    """
    Compile ClassName.java → ClassName.class if stale or missing.
    Raises RuntimeError if javac fails.
    """
    java_src   = _JAVA_MODULES / f"{class_name}.java"
    class_file = _JAVA_MODULES / f"{class_name}.class"

    if class_name in _COMPILED and class_file.exists():
        return

    if not java_src.exists():
        raise FileNotFoundError(f"{java_src} not found")

    # Compile
    result = subprocess.run(
        ["javac", "-d", str(_JAVA_MODULES), str(java_src)],
        capture_output=True,
        text=True,
        timeout=30,
        shell=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"javac failed for {class_name}: {result.stderr}")

    _COMPILED.add(class_name)
    logger.info(f"Java: compiled {class_name}.java")


def run_simulation(sim_type: str, params: dict) -> dict:
    """
    Run a Java simulation engine and return its JSON output as a dict.

    Args:
        sim_type: One of 'stack', 'heap', 'rop'
        params:   dict of simulation parameters (validated by caller)

    Returns:
        dict parsed from Java stdout

    Raises:
        ValueError:   unknown sim_type
        RuntimeError: compilation or execution failure
        TimeoutError: Java process exceeded 5s
    """
    if sim_type not in CLASS_MAP:
        raise ValueError(
            f"Unknown simulation type '{sim_type}'. "
            f"Allowed: {list(CLASS_MAP.keys())}"
        )

    class_name = CLASS_MAP[sim_type]
    _ensure_compiled(class_name)

    # JSON-encode params — no shell interpolation risk
    args_json = json.dumps(params)

    cmd = [
        "java",
        "-cp", str(_JAVA_MODULES),
        class_name,
        args_json,
    ]

    logger.debug(f"Java bridge: {' '.join(cmd)}")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=5,
            shell=False,
        )
    except subprocess.TimeoutExpired:
        raise TimeoutError(f"Java simulation '{sim_type}' timed out (>5s)")

    if result.returncode != 0:
        logger.error(f"Java bridge stderr: {result.stderr}")
        raise RuntimeError(
            f"Simulation '{sim_type}' failed (exit {result.returncode}): {result.stderr[:200]}"
        )

    stdout = result.stdout.strip()
    if not stdout:
        raise RuntimeError(f"Java simulation '{sim_type}' produced no output")

    try:
        return json.loads(stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Java simulation '{sim_type}' returned invalid JSON: {exc} "
            f"(raw: {stdout[:200]})"
        )
