import { afterEach, describe, expect, it, vi } from "vitest";
import { walletBalances } from "./wallet.server";
describe("wallet balance accuracy", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("rejects a failed network read rather than reporting zero", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
    await expect(walletBalances({ evm: "0x123", bitcoin: "btc", solana: "sol", ton: "ton", tron: "tron" })).rejects.toThrow("Offline");
  });
  it("rejects an RPC error rather than reporting zero", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify(url.includes('trongrid') ? {data:[]} : { error: { code: -1 } }), { status: 200 })));
    await expect(walletBalances({ evm: "0x123", bitcoin: "btc", solana: "sol", ton: "ton", tron: "tron" })).rejects.toThrow();
  });
});
