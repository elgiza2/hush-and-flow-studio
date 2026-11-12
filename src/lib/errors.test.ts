import { describe, expect, it } from "vitest";
import { userErrorText } from "./errors";

describe("userErrorText", () => {
  it("explains subscription-only use", () => expect(userErrorText("subscription_required 402")).toBe("An active subscription is required. Choose a plan to continue."));
  it("keeps clear messages written for people", () => {
    expect(userErrorText(new Error("Not enough SOL for the network fee."))).toBe("Not enough SOL for the network fee.");
  });
  it("turns a raw provider failure into a plain sentence", () => {
    expect(userErrorText(new Error('Provider request failed [500]: {"error":"internal"}'))).toBe("The service is busy right now. Please try again in a moment.");
  });
  it("turns a lost connection into a connection message", () => {
    expect(userErrorText(new TypeError("Failed to fetch"))).toBe("Network issue. Check your connection and try again.");
  });
  it("hides code exceptions behind the fallback", () => {
    expect(userErrorText(new TypeError("Cannot read properties of undefined (reading 'id')"), "Could not save the bot.")).toBe("Could not save the bot.");
  });
  it("hides database internals", () => {
    expect(userErrorText(new Error('duplicate key value violates unique constraint "bots_pkey"'))).toBe("That already exists.");
  });
  it("uses the fallback for empty errors", () => {
    expect(userErrorText({}, "Trade failed")).toBe("Trade failed");
  });
});
