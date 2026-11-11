import { describe, expect, it } from "vitest";
import { formatExecution, normalizeLanguage } from "./execution";

describe("cloud computer output", () => {
  it("joins printed output and the final value", () => {
    const r = formatExecution(['{"type":"stdout","text":"hi\\n"}', '{"type":"result","text":"3","is_main_result":true}', '{"type":"end_of_execution"}'].join("\n"));
    expect(r).toEqual({ ok: true, output: "hi\n3" });
  });
  it("reports code errors as a failed run", () => {
    const r = formatExecution('{"type":"error","name":"ZeroDivisionError","value":"division by zero","traceback":""}');
    expect(r.ok).toBe(false);
    expect(r.output).toContain("ZeroDivisionError: division by zero");
  });
  it("maps language names to the three supported runtimes", () => {
    expect(normalizeLanguage("js")).toBe("javascript");
    expect(normalizeLanguage("shell")).toBe("bash");
    expect(normalizeLanguage(undefined)).toBe("python");
  });
});
