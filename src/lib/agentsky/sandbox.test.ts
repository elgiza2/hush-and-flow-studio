import { afterEach, describe, expect, it, vi } from "vitest";
import { runSandboxCode } from "./sandbox.server";

describe("unconfigured computer execution", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("never evaluates supplied code in the application process", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("E2B_API_KEY", "");
    const marker = "__audit_execution_marker__";
    Reflect.deleteProperty(globalThis, marker);
    const result = await runSandboxCode(`globalThis.${marker} = true; return 42`);
    expect(result.ok).toBe(false);
    expect(Reflect.has(globalThis, marker)).toBe(false);
  });
});