"""
tests/backend/test_simulation.py
──────────────────────────────────
Tests for the Java-powered simulation endpoints.
Phase 6 routes: POST /api/simulation/<type>

These tests run the actual Java bridge (Java 25 required on PATH).
Marked with @pytest.mark.slow if you want to exclude them in CI without Java.
"""
import re
import pytest


class TestSimulationStack:
    """Stack buffer overflow simulation tests."""

    def test_stack_step1_clean_frame(self, client):
        """Step 1 should show a clean stack frame with canary intact."""
        res = client.post("/api/simulation/stack", json={"step": 1})
        assert res.status_code == 200
        data = res.get_json()
        assert data["type"] == "stack_bof"
        assert data["step"] == 1
        assert data["exploit_stage"] == "setup"
        # All buffer cells should be zeroed
        mem = data["memory_map"]
        buf_cells = [c for c in mem if c["region"] == "buffer"]
        assert all(c["status"] == "normal" for c in buf_cells)
        # Canary intact
        canary = next(c for c in mem if c["label"] == "canary")
        assert canary["status"] == "intact"

    def test_stack_step5_rip_hijacked(self, client):
        """Step 5 should show saved_rip overwritten with attacker data."""
        res = client.post("/api/simulation/stack", json={"step": 5})
        assert res.status_code == 200
        data = res.get_json()
        assert data["exploit_stage"] == "rip_hijacked"
        mem = data["memory_map"]
        rip_cell = next(c for c in mem if c["label"] == "saved_rip")
        assert rip_cell["status"] == "hijacked"
        assert rip_cell["value"] == "0x41414141"

    def test_stack_step4_canary_broken(self, client):
        """Step 4 should show canary corrupted."""
        res = client.post("/api/simulation/stack", json={"step": 4})
        assert res.status_code == 200
        data = res.get_json()
        assert data["exploit_stage"] == "canary_broken"
        mem = data["memory_map"]
        canary = next(c for c in mem if c["label"] == "canary")
        assert canary["status"] == "broken"

    def test_stack_with_no_body_defaults_to_step1(self, client):
        """No body should use default step=1 and return 200."""
        res = client.post("/api/simulation/stack")
        assert res.status_code == 200
        data = res.get_json()
        assert data["step"] == 1

    def test_stack_step_out_of_range_high(self, client):
        """step=99 should return 400."""
        res = client.post("/api/simulation/stack", json={"step": 99})
        assert res.status_code == 400
        assert "error" in res.get_json()

    def test_stack_step_zero(self, client):
        """step=0 should return 400 (below minimum of 1)."""
        res = client.post("/api/simulation/stack", json={"step": 0})
        assert res.status_code == 400

    def test_stack_step_invalid_string(self, client):
        """Non-integer step should return 400."""
        res = client.post("/api/simulation/stack", json={"step": "bad"})
        assert res.status_code == 400

    def test_stack_memory_map_structure(self, client):
        """Each memory_map entry must have all required fields."""
        res = client.post("/api/simulation/stack", json={"step": 1})
        data = res.get_json()
        required_fields = {"address", "label", "value", "region", "status"}
        for cell in data["memory_map"]:
            assert required_fields.issubset(cell.keys()), (
                f"Missing fields in cell: {cell}"
            )

    def test_stack_registers_present(self, client):
        """registers dict must include rsp, rbp, rip."""
        res = client.post("/api/simulation/stack", json={"step": 2})
        data = res.get_json()
        regs = data.get("registers", {})
        assert "rsp" in regs
        assert "rbp" in regs
        assert "rip" in regs

    def test_stack_total_steps_correct(self, client):
        """total_steps should be 5 for the stack simulation."""
        res = client.post("/api/simulation/stack", json={"step": 1})
        data = res.get_json()
        assert data["total_steps"] == 5


class TestSimulationHeap:
    """Heap visualizer simulation tests."""

    def test_heap_alloc_phase(self, client):
        """Alloc phase should return 4 in_use chunks."""
        res = client.post("/api/simulation/heap", json={"phase": "alloc"})
        assert res.status_code == 200
        data = res.get_json()
        assert data["type"] == "heap_viz"
        assert data["phase"] == "alloc"
        chunks = data["chunks"]
        assert len(chunks) == 4
        assert all(c["status"] == "in_use" for c in chunks)

    def test_heap_uaf_phase(self, client):
        """UAF phase should show chunk B as corrupted."""
        res = client.post("/api/simulation/heap", json={"phase": "uaf"})
        assert res.status_code == 200
        data = res.get_json()
        assert data["phase"] == "uaf"
        corrupted = [c for c in data["chunks"] if c["status"] == "corrupted"]
        assert len(corrupted) >= 1

    def test_heap_free_phase_shows_freed_chunks(self, client):
        """Free phase should show at least 2 freed chunks."""
        res = client.post("/api/simulation/heap", json={"phase": "free"})
        data = res.get_json()
        freed = [c for c in data["chunks"] if c["status"] == "freed"]
        assert len(freed) >= 2

    def test_heap_invalid_phase(self, client):
        """Unknown phase should return 400."""
        res = client.post("/api/simulation/heap", json={"phase": "invalid"})
        assert res.status_code == 400

    def test_heap_default_to_alloc(self, client):
        """No body should default to alloc phase."""
        res = client.post("/api/simulation/heap")
        assert res.status_code == 200
        data = res.get_json()
        assert data["phase"] == "alloc"


class TestSimulationROP:
    """ROP chain simulation tests."""

    def test_rop_step1_pop_rdi_gadget(self, client):
        """Step 1 should show the 'pop rdi ; ret' gadget."""
        res = client.post("/api/simulation/rop", json={"step": 1})
        assert res.status_code == 200
        data = res.get_json()
        assert data["type"] == "rop_chain"
        gadget = data["current_gadget"]
        assert "pop rdi" in gadget["instruction"]

    def test_rop_step6_shell_spawned(self, client):
        """Step 6 should show the shell-spawned endpoint."""
        res = client.post("/api/simulation/rop", json={"step": 6})
        assert res.status_code == 200
        data = res.get_json()
        assert "shell" in data["description"].lower()

    def test_rop_chain_progress_has_six_items(self, client):
        """chain_progress must have exactly 6 entries."""
        res = client.post("/api/simulation/rop", json={"step": 3})
        data = res.get_json()
        assert len(data["chain_progress"]) == 6

    def test_rop_chain_progress_current_flag(self, client):
        """Exactly one chain_progress item should have current=True."""
        res = client.post("/api/simulation/rop", json={"step": 3})
        data = res.get_json()
        current = [g for g in data["chain_progress"] if g.get("current")]
        assert len(current) == 1
        assert current[0]["step"] == 3

    def test_rop_step_out_of_range(self, client):
        """step=99 should return 400."""
        res = client.post("/api/simulation/rop", json={"step": 99})
        assert res.status_code == 400

    def test_rop_stack_slice_present(self, client):
        """stack slice must contain offset and value fields."""
        res = client.post("/api/simulation/rop", json={"step": 1})
        data = res.get_json()
        stack = data.get("stack", [])
        assert len(stack) > 0
        for entry in stack:
            assert "offset" in entry
            assert "value"  in entry


class TestSimulationGeneral:
    """General simulation route behaviour."""

    def test_unknown_simulation_type_returns_400(self, client):
        """Completely unknown sim_type should return 400."""
        res = client.post("/api/simulation/nuclear")
        assert res.status_code == 400
        assert "error" in res.get_json()

    def test_unknown_type_error_message(self, client):
        """Error message should list available simulation types."""
        data = client.post("/api/simulation/unknown").get_json()
        assert "Available" in data["error"] or "allowed" in data["error"].lower()
