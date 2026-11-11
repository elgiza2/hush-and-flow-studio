import { describe, expect, it } from "vitest";
import { routineHookSignature, sameSignature } from "./routineHook";
describe("instant routine links", () => {
  it("differ per routine", async () => { expect(await routineHookSignature("s", "a")).not.toBe(await routineHookSignature("s", "b")); });
  it("reject a forged signature", async () => { const real = await routineHookSignature("s", "a"); expect(sameSignature(real, "0".repeat(real.length))).toBe(false); expect(sameSignature(real, real)).toBe(true); });
});
