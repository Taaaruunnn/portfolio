import java.util.*;

/**
 * ROPChain.java
 * ──────────────
 * Educational ROP chain step-through visualizer.
 * Simulates a ret2libc/SROP sequence targeting execve("/bin/sh").
 * Accepts: JSON string arg → {"step": 1..6}
 * Outputs: JSON to stdout
 */
public class ROPChain {

    record Gadget(String address, String instruction, String effect) {}

    static final List<Gadget> CHAIN = List.of(
        new Gadget("0x400f7e", "pop rdi ; ret",        "rdi ← 0x601048  (/bin/sh address)"),
        new Gadget("0x400f82", "pop rsi ; ret",        "rsi ← 0x0       (argv = NULL)"),
        new Gadget("0x400f86", "pop rdx ; ret",        "rdx ← 0x0       (envp = NULL)"),
        new Gadget("0x400f8a", "pop rax ; ret",        "rax ← 0x3b      (execve syscall number = 59)"),
        new Gadget("0x400f8e", "syscall",              "kernel execve(\"/bin/sh\", NULL, NULL)"),
        new Gadget("0x7fff2100", "--- shell spawned ---", "$ id → uid=0(root)")
    );

    public static void main(String[] args) throws Exception {
        int step = 1;
        if (args.length > 0) {
            String json = args[0].replaceAll("[{}\"]", "");
            for (String part : json.split(",")) {
                String[] kv = part.split(":");
                if (kv.length == 2 && kv[0].trim().equals("step")) {
                    step = Integer.parseInt(kv[1].trim());
                }
            }
        }
        step = Math.max(1, Math.min(6, step));

        Map<String, Object> result = buildStep(step);
        System.out.println(toJson(result));
    }

    static Map<String, Object> buildStep(int step) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("type",        "rop_chain");
        out.put("step",        step);
        out.put("total_steps", 6);

        Gadget current = CHAIN.get(step - 1);

        String[] descriptions = {
            "Gadget 1: Return address overwritten to point to a 'pop rdi ; ret' gadget. This loads the address of the '/bin/sh' string (found in libc) into RDI — the first argument register.",
            "Gadget 2: 'pop rsi ; ret' zeros out RSI. In the x86-64 calling convention, RSI holds the second argument (argv). NULL means no argument vector.",
            "Gadget 3: 'pop rdx ; ret' zeros out RDX. RDX holds the third argument (envp). NULL gives a clean environment.",
            "Gadget 4: 'pop rax ; ret' sets RAX to 59 (0x3b). This is the execve() syscall number on Linux x86-64.",
            "Gadget 5: 'syscall' transfers control to the kernel. With RDI='/bin/sh', RSI=0, RDX=0, RAX=59, the kernel executes execve('/bin/sh', NULL, NULL).",
            "Shell spawned! ✓ execve() succeeded. A /bin/sh process is running under the exploited program's privileges. ROP chain complete."
        };
        out.put("description", descriptions[step - 1]);

        Map<String, String> gadget = new LinkedHashMap<>();
        gadget.put("address",     current.address());
        gadget.put("instruction", current.instruction());
        gadget.put("effect",      current.effect());
        out.put("current_gadget", gadget);

        // Register file at each step
        out.put("registers", registersAt(step));

        // Stack slice showing what's left
        out.put("stack", stackAt(step));

        // Chain progress sidebar
        List<Map<String, Object>> progress = new ArrayList<>();
        for (int i = 0; i < CHAIN.size(); i++) {
            Map<String, Object> g = new LinkedHashMap<>();
            g.put("step",    i + 1);
            g.put("done",    i < step);
            g.put("current", i == step - 1);
            g.put("gadget",  CHAIN.get(i).instruction());
            progress.add(g);
        }
        out.put("chain_progress", progress);

        return out;
    }

    static Map<String, String> registersAt(int step) {
        Map<String, String> r = new LinkedHashMap<>();
        r.put("rip", CHAIN.get(step - 1).address());
        r.put("rdi", step >= 1 ? "0x0000000000601048" : "0x0");
        r.put("rsi", step >= 2 ? "0x0000000000000000" : "0x7fff0008");
        r.put("rdx", step >= 3 ? "0x0000000000000000" : "0x7fff0010");
        r.put("rax", step >= 4 ? "0x000000000000003b" : "0x0");
        r.put("rsp", String.format("0x7ffe%04x", 0xa000 + (step - 1) * 16));
        return r;
    }

    static List<Map<String, String>> stackAt(int step) {
        List<Map<String, String>> stack = new ArrayList<>();
        // Show remaining gadgets as stack entries
        for (int i = step - 1; i < Math.min(CHAIN.size(), step + 2); i++) {
            Map<String, String> entry = new LinkedHashMap<>();
            long offset = (long)(i - (step - 1)) * 8;
            entry.put("offset", String.format("+0x%02x", offset));
            entry.put("value",  CHAIN.get(i).address());
            entry.put("label",  CHAIN.get(i).instruction());
            stack.add(entry);
        }
        return stack;
    }

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
