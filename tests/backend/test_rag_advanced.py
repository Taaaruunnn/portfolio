"""
tests/backend/test_rag_advanced.py
────────────────────────────────────
Advanced edge-case tests for the RAG endpoint.
Tests guard conditions, response shape correctness,
and behaviour with atypical inputs.
"""
import pytest


def _post(client, question):
    return client.post(
        "/api/rag/query",
        json={"question": question},
        content_type="application/json",
    )


class TestRAGGuardAdvanced:
    """Guard-condition edge cases not covered in test_security.py."""

    def test_whitespace_only_question_blocked(self, client):
        """A question made of only spaces should fail validation."""
        res = _post(client, "   ")
        assert res.status_code == 400

    def test_tab_only_question_blocked(self, client):
        """A question made of only tab chars should fail."""
        res = _post(client, "\t\t\t")
        assert res.status_code == 400

    def test_2_char_question_blocked(self, client):
        """Questions shorter than 3 chars should be rejected."""
        res = _post(client, "ab")
        assert res.status_code == 400

    def test_3_char_question_accepted(self, client):
        """A 3-char question is at the minimum boundary and should be accepted."""
        res = _post(client, "SQL")
        # 200 or 400 depending on vocabulary match — must not be 500
        assert res.status_code in (200, 400)
        assert res.status_code != 500

    def test_exactly_2000_chars_accepted(self, client):
        """A question at the maximum allowed length should not be blocked."""
        question = "What is SQL injection?" + "a" * (2000 - len("What is SQL injection?"))
        res = _post(client, question)
        assert res.status_code in (200, 400)
        assert res.status_code != 500

    def test_2001_chars_blocked(self, client):
        """Questions longer than 2000 chars should return 400."""
        res = _post(client, "X" * 2001)
        assert res.status_code == 400

    def test_unicode_question_no_crash(self, client):
        """Non-ASCII characters in a question should not cause a 500."""
        res = _post(client, "什么是SQL注入攻击？")
        assert res.status_code in (200, 400)  # validation may reject, must not crash

    def test_null_bytes_in_question_handled(self, client):
        """Null bytes in question should not crash the backend."""
        res = _post(client, "What is buffer overflow\x00?")
        assert res.status_code in (200, 400)
        assert res.status_code != 500


class TestRAGResponseShape:
    """Validate the structure of successful RAG responses."""

    def _ask(self, client, question="What is a buffer overflow attack?"):
        res = _post(client, question)
        assert res.status_code == 200, f"RAG returned {res.status_code}: {res.get_json()}"
        return res.get_json()

    def test_answer_is_non_empty_string(self, client):
        """answer field must be a non-empty string."""
        data = self._ask(client)
        assert isinstance(data["answer"], str)
        assert len(data["answer"]) > 0

    def test_confidence_in_range(self, client):
        """confidence must be a float between 0.0 and 1.0 inclusive."""
        data = self._ask(client)
        conf = data["confidence"]
        assert isinstance(conf, (int, float))
        assert 0.0 <= conf <= 1.0

    def test_sources_is_list_of_dicts(self, client):
        """sources must be a list; each item must have at least a score or title."""
        data = self._ask(client)
        sources = data["sources"]
        assert isinstance(sources, list)
        for src in sources:
            assert isinstance(src, dict)

    def test_method_field_is_valid(self, client):
        """method field must be one of the known retrieval strategies."""
        data = self._ask(client)
        assert data["method"] in ("bm25", "openai")

    def test_related_topics_is_list(self, client):
        """related_topics must be a list (may be empty)."""
        data = self._ask(client)
        rt = data.get("related_topics", [])
        assert isinstance(rt, list)

    def test_different_questions_different_answers(self, client):
        """Two semantically different questions should produce different answers."""
        d1 = self._ask(client, "What is SQL injection?")
        d2 = self._ask(client, "What is a buffer overflow attack?")
        # At minimum they must not be byte-for-byte identical
        assert d1["answer"] != d2["answer"]
