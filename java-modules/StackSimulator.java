import java.util.*;

/**
 * StackSimulator.java
 * ────────────────────
 * Educational stack buffer-overflow animation.
 * Accepts: JSON string arg  →  {"step": 1..5}
 * Outputs: JSON object to stdout
 *
 * Simulates a 32-byte stack buffer on a fictional x86-64 system.
 * Steps: 1=clean frame, 2=safe write, 3=overflow begin, 4=canary broken, 5=ret hijacked
 */
public class StackSimulator {

    // Memory layout (fictional addresses, educational)
    static final long BASE    = 0xffffd000L;
    static final long CANARY  = 0xffffd020L;
    static final long SAVED_RBP = 0xffffd028L;
    static final long SAVED_RIP = 0xffffd030L;

    static final String CANARY_VALUE   = "0x4f62df0a";
    static final String ORIGINAL_RIP   = "0x00400e10";
    static final String HIJACKED_RIP   = "0x41414141";  // attacker-controlled

    public static void main(String[] args) throws Exception {
        int step = 1;
        if (args.length > 0) {
            // Simple JSON parse — look for "step" key
            String json = args[0].replaceAll("[{}\"]", "");
            for (String part : json.split(",")) {
                String[] kv = part.split(":");
                if (kv.length == 2 && kv[0].trim().equals("step")) {
                    step = Integer.parseInt(kv[1].trim());
                }
            }
        }
        step = Math.max(1, Math.min(5, step));

        Map<String, Object> result = buildStep(step);
        System.out.println(toJson(result));
    }

    static Map<String, Object> buildStep(int step) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("type",        "stack_bof");
        out.put("step",        step);
        out.put("total_steps", 5);

        String[] descriptions = {
            "Step 1: Normal stack frame. The function has been called. rsp points to the base of our 32-byte buffer. The canary sits above the buffer to detect overflows.",
            "Step 2: Safe write (16 bytes). User input of 16 bytes fills the lower half of the buffer. No corruption — stack integrity intact.",
            "Step 3: Overflow begins (36 bytes). Input exceeds the 32-byte buffer boundary and begins overwriting stack memory above it.",
            "Step 4: Stack canary overwritten! The canary value 0x4f62df0a has been replaced with attacker data. A real system would call __stack_chk_fail() here.",
            "Step 5: saved_rip hijacked. 48 bytes of input have corrupted the return address. On ret, control transfers to 0x41414141 — attacker-controlled memory."
        };
        out.put("description", descriptions[step - 1]);

        String[] stages = {"setup", "safe_write", "overflow_start", "canary_broken", "rip_hijacked"};
        out.put("exploit_stage", stages[step - 1]);

        List<Map<String, String>> memory = new ArrayList<>();
        memory.add(cell("0xffffd000", "buf[0..7]",   bufVal(step, 0),  "buffer", bufStatus(step, 0)));
        memory.add(cell("0xffffd008", "buf[8..15]",  bufVal(step, 1),  "buffer", bufStatus(step, 1)));
        memory.add(cell("0xffffd010", "buf[16..23]", bufVal(step, 2),  "buffer", bufStatus(step, 2)));
        memory.add(cell("0xffffd018", "buf[24..31]", bufVal(step, 3),  "buffer", bufStatus(step, 3)));
        memory.add(cell("0xffffd020", "canary",     canaryVal(step),   "canary", canaryStatus(step)));
        memory.add(cell("0xffffd028", "saved_rbp",  rbpVal(step),      "saved",  rbpStatus(step)));
        memory.add(cell("0xffffd030", "saved_rip",  ripVal(step),      "ret",    ripStatus(step)));
        out.put("memory_map", memory);

        Map<String, String> regs = new LinkedHashMap<>();
        regs.put("rsp", "0xffffd000");
        regs.put("rbp", step < 5 ? "0xffffd040" : "0x41414141");
        regs.put("rip", step < 5 ? ORIGINAL_RIP : HIJACKED_RIP);
        out.put("registers", regs);

        return out;
    }

    static String bufVal(int step, int chunk) {
        // chunk 0,1 = first 16 bytes (written at step 2+); chunk 2,3 = last 16 (overflow at step 3+)
        if (step == 1) return "0x0000000000000000";
        if (chunk <= 1) return "0x4141414141414141";
        if (step >= 3 && chunk <= 3) return "0x4141414141414141";
        return "0x0000000000000000";
    }

    static String bufStatus(int step, int chunk) {
        if (step == 1) return "normal";
        if (chunk <= 1) return "written";
        if (step >= 3) return "overflow";
        return "normal";
    }

    static String canaryVal(int step) {
        return step <= 3 ? CANARY_VALUE : "0x4141414141414141";
    }

    static String canaryStatus(int step) {
        return step <= 3 ? "intact" : "broken";
    }

    static String rbpVal(int step) {
        return step < 5 ? "0xffffd040" : "0x4141414141414141";
    }

    static String rbpStatus(int step) {
        return step < 5 ? "normal" : "corrupted";
    }

    static String ripVal(int step) {
        return step < 5 ? ORIGINAL_RIP : HIJACKED_RIP;
    }

    static String ripStatus(int step) {
        return step < 5 ? "normal" : "hijacked";
    }

    static Map<String, String> cell(String addr, String label, String value, String region, String status) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("address", addr);
        m.put("label",   label);
        m.put("value",   value);
        m.put("region",  region);
        m.put("status",  status);
        return m;
    }

    // Minimal JSON serialisation — no external dependency needed
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
            return "\"" + obj.toString().replace("\"", "\\\"") + "\"";
        }
    }
}
