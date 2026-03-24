import java.util.*;

/**
 * HeapVisualizer.java
 * ────────────────────
 * Educational ptmalloc2-style heap visualizer.
 * Accepts: JSON string arg → {"phase": "alloc|free|spray|uaf"}
 * Outputs: JSON to stdout
 *
 * Phases: alloc → free → spray → uaf
 */
public class HeapVisualizer {

    public static void main(String[] args) throws Exception {
        String phase = "alloc";
        if (args.length > 0) {
            String json = args[0].replaceAll("[{}\"]", "");
            for (String part : json.split(",")) {
                String[] kv = part.split(":");
                if (kv.length == 2 && kv[0].trim().equals("phase")) {
                    phase = kv[1].trim();
                }
            }
        }

        Map<String, Object> result = buildPhase(phase);
        System.out.println(toJson(result));
    }

    static Map<String, Object> buildPhase(String phase) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("type",  "heap_viz");
        out.put("phase", phase);

        Map<String, String> descriptions = new LinkedHashMap<>();
        descriptions.put("alloc", "Phase 1: Allocation. malloc() calls place 4 chunks in the heap. Each chunk has a 16-byte metadata header: prev_size (used if previous chunk is free) + size (including flags). All chunks are PREV_INUSE.");
        descriptions.put("free",  "Phase 2: Free. Chunks B and D are freed with free(). They are inserted into the tcache/fast-bin. Freed chunks store forward/backward pointers where user data was.");
        descriptions.put("spray", "Phase 3: Heap Spray. 0x41 bytes fill freshly-allocated regions to align heap layout for a later exploit. Chunk metadata boundaries are targeted with repeating patterns.");
        descriptions.put("uaf",   "Phase 4: Use-After-Free. Chunk B was freed, but a stale pointer still references it. Writing through the stale pointer corrupts the fd pointer of the freed chunk — next malloc() may return an attacker-controlled address.");

        out.put("description", descriptions.getOrDefault(phase, "Unknown phase."));

        List<Map<String, Object>> chunks = new ArrayList<>();

        switch (phase) {
            case "alloc" -> {
                chunks.add(chunk("0x602000", 32, 0, "PREV_INUSE", "48656c6c6f576f726c6400000000000000000000", "in_use", "A"));
                chunks.add(chunk("0x602030", 32, 0, "PREV_INUSE", "536563726574446174610000000000000000000", "in_use", "B"));
                chunks.add(chunk("0x602060", 32, 0, "PREV_INUSE", "436f6e74656e7430303030000000000000000000", "in_use", "C"));
                chunks.add(chunk("0x602090", 32, 0, "PREV_INUSE", "50617373776f72647300000000000000000000", "in_use", "D"));
            }
            case "free" -> {
                chunks.add(chunk("0x602000", 32, 0, "PREV_INUSE", "48656c6c6f576f726c6400000000000000000000", "in_use",  "A"));
                chunks.add(chunk("0x602030", 32, 0, "PREV_INUSE", "0x0000000000602090 (fd ptr)", "freed", "B"));
                chunks.add(chunk("0x602060", 32, 0, "PREV_INUSE", "436f6e74656e7430303030000000000000000000", "in_use",  "C"));
                chunks.add(chunk("0x602090", 32, 0, "PREV_INUSE", "0x0000000000602030 (fd ptr)", "freed", "D"));
            }
            case "spray" -> {
                chunks.add(chunk("0x602000", 32, 0, "PREV_INUSE", "4141414141414141414141414141414141414141", "sprayed", "A"));
                chunks.add(chunk("0x602030", 32, 0, "PREV_INUSE", "4141414141414141414141414141414141414141", "sprayed", "B"));
                chunks.add(chunk("0x602060", 32, 0, "PREV_INUSE", "4141414141414141414141414141414141414141", "sprayed", "C"));
                chunks.add(chunk("0x602090", 32, 0, "PREV_INUSE", "4141414141414141414141414141414141414141", "sprayed", "D"));
            }
            case "uaf" -> {
                chunks.add(chunk("0x602000", 32, 0, "PREV_INUSE", "48656c6c6f576f726c6400000000000000000000", "in_use",    "A"));
                chunks.add(chunk("0x602030", 32, 0, "PREV_INUSE", "0xdeadbeefdeadbeef (fd corrupted!)", "corrupted", "B (freed, stale ptr used)"));
                chunks.add(chunk("0x602060", 32, 0, "PREV_INUSE", "436f6e74656e7430303030000000000000000000", "in_use",    "C"));
                chunks.add(chunk("0x602090", 32, 0, "PREV_INUSE", "0x0000000000602030 (fd ptr)", "freed",     "D"));
            }
        }

        out.put("chunks", chunks);

        // Bin state
        Map<String, Object> bins = new LinkedHashMap<>();
        if (phase.equals("free")) {
            bins.put("tcache_0x30", List.of("0x602090", "0x602030"));
        } else if (phase.equals("uaf")) {
            bins.put("tcache_0x30", List.of("0xdeadbeefdeadbeef", "0x602090"));
        }
        out.put("bins", bins);

        return out;
    }

    static Map<String, Object> chunk(String addr, int size, int prevSize,
                                      String flags, String data, String status, String label) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("address",   addr);
        m.put("label",     label);
        m.put("size",      size);
        m.put("prev_size", prevSize);
        m.put("flags",     flags);
        m.put("data",      data);
        m.put("status",    status);
        return m;
    }

    // Reuse same toJson as StackSimulator
    static String toJson(Object obj) {
        if (obj instanceof Map) {
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<?, ?> e : ((Map<?,?>) obj).entrySet()) {
                if (!first) sb.append(",");
                sb.append("\"").append(e.getKey()).append("\":");
                sb.append(toJson(e.getValue()));
                first = false;
            }
            return sb.append("}").toString();
        } else if (obj instanceof List) {
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Object item : (List<?>) obj) {
                if (!first) sb.append(",");
                sb.append(toJson(item));
                first = false;
            }
            return sb.append("]").toString();
        } else if (obj instanceof Integer || obj instanceof Long || obj instanceof Boolean) {
            return obj.toString();
        } else {
            return "\"" + obj.toString().replace("\"", "\\\"").replace("\n", "\\n") + "\"";
        }
    }
}
