import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), read: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: () => ({
  insert: mocks.insert,
  select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.read }) }) }),
  update: (values: unknown) => { mocks.update(values); return { eq: () => ({ eq: async () => ({ error: null }) }) }; },
}) } }));
import { guardedWalletAction } from "./operations.server";
describe("wallet transfer reservation", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.insert.mockResolvedValue({ error: null }); });
  it("records a confirmed result once", async () => {
    const execute = vi.fn(async () => Response.json({ tx: "transaction-1" }));
    const result = await guardedWalletAction("owner", "key", "payload", execute);
    expect(await result.json()).toEqual({ tx: "transaction-1" });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith({ status: "completed", result: { tx: "transaction-1" } });
  });
  it("does not repeat a pending transfer", async () => {
    mocks.insert.mockResolvedValue({ error: { code: "23505" } });
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("payload"))), b => b.toString(16).padStart(2, "0")).join("");
    mocks.read.mockResolvedValue({ data: { request_hash: digest, status: "processing" }, error: null });
    const execute = vi.fn();
    expect((await guardedWalletAction("owner", "key", "payload", execute)).status).toBe(409);
    expect(execute).not.toHaveBeenCalled();
  });
  it("marks uncertain execution for review instead of retry", async () => {
    const execute = vi.fn(async () => { throw new Error("Connection lost"); });
    expect((await guardedWalletAction("owner", "key", "payload", execute)).status).toBe(409);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith({ status: "unknown" });
  });
});
