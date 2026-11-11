import { describe, expect, it } from "vitest";
import { compactMessages, createFailureTracker } from "./selfHealing";

describe("self healing", () => {
  it("gives up after 3 identical failures", () => {
    const t = createFailureTracker();
    expect(t.record("run_code", { code: "x" }, false).giveUp).toBe(false);
    expect(t.record("run_code", { code: "x" }, false).giveUp).toBe(false);
    expect(t.record("run_code", { code: "x" }, false).giveUp).toBe(true);
  });
  it("resets after success", () => {
    const t = createFailureTracker();
    t.record("a", {}, false); t.record("a", {}, false); t.record("a", {}, true);
    expect(t.record("a", {}, false).attempt).toBe(1);
  });
  it("shortens old tool outputs but keeps recent ones", () => {
    const msgs = Array.from({ length: 10 }, (_, i) => ({ role: "tool", tool_call_id: String(i), content: "x".repeat(10_000) }));
    compactMessages(msgs, 70_000, 6);
    expect(msgs[0].content!.length).toBeLessThan(1000);
    expect(msgs[9].content!.length).toBe(10_000);
  });
});
