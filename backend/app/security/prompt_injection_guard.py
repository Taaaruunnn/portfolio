"""
app/security/prompt_injection_guard.py
───────────────────────────────────────
Guard against prompt injection attacks on the RAG/LLM pipeline.

Phase 2 scope: structural validation only (length, basic pattern checks).
Phase 4 will add semantic similarity checks against known injection patterns.

Usage:
    from app.security.prompt_injection_guard import validate_prompt

    result = validate_prompt(user_input)
    if not result.is_safe:
        return jsonify({"error": result.reason}), 400
"""
import re
from dataclasses import dataclass

# ── Configuration ──────────────────────────────────────────────────
MAX_PROMPT_LENGTH: int = 1000   # Characters — prevents token exhaustion
MAX_PROMPT_LINES: int = 20      # Lines — prevents multi-turn injection

# Known prompt injection pattern fragments (case-insensitive).
# Expanded in Phase 4 with semantic similarity.
_INJECTION_PATTERNS: list[str] = [
    r"ignore\s+(previous|above|prior|all)\s+(instructions?|prompts?|context)",
    r"disregard\s+(your|all|any)\s+(instructions?|rules?|guidelines?)",
    r"you\s+are\s+now\s+(a|an|the)",
    r"(act|pretend|roleplay|behave)\s+as\s+(if\s+you\s+(are|were)|a)",
    r"(system|admin|root)\s*:\s*",
    r"<\s*(system|user|assistant)\s*>",
    r"###\s*(instruction|system|override)",
    r"jailbreak",
    r"DAN\s+mode",
]

_COMPILED_PATTERNS: list[re.Pattern] = [
    re.compile(p, re.IGNORECASE | re.DOTALL) for p in _INJECTION_PATTERNS
]


@dataclass
class GuardResult:
    is_safe: bool
    reason: str = ""


def validate_prompt(text: str) -> GuardResult:
    """
    Check a user-supplied prompt for injection attempts.

    Returns a GuardResult with is_safe=True if the prompt passes all checks.
    Returns is_safe=False with a reason string if a violation is detected.
    The reason is SAFE to return to the client (no internal detail exposed).
    """
    if not isinstance(text, str):
        return GuardResult(is_safe=False, reason="Query must be a string.")

    # ── Length checks ─────────────────────────────────────────────
    if len(text) > MAX_PROMPT_LENGTH:
        return GuardResult(
            is_safe=False,
            reason=f"Query exceeds maximum length of {MAX_PROMPT_LENGTH} characters.",
        )

    if text.count("\n") > MAX_PROMPT_LINES:
        return GuardResult(
            is_safe=False,
            reason=f"Query contains too many lines (max {MAX_PROMPT_LINES}).",
        )

    # ── Empty check ───────────────────────────────────────────────
    if not text.strip():
        return GuardResult(is_safe=False, reason="Query cannot be empty.")

    # ── Pattern check ─────────────────────────────────────────────
    for pattern in _COMPILED_PATTERNS:
        if pattern.search(text):
            return GuardResult(
                is_safe=False,
                reason="Query contains disallowed content.",
            )

    return GuardResult(is_safe=True)
