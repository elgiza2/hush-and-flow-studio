import { describe, expect, it } from "vitest";
import { needsBrowserLogin } from "./taskOutcome";
describe("human browser verification", () => {
  it("does not report an unfinished login handoff as task completion", () => {
    expect(needsBrowserLogin([{ type: "agent.tool_result", part: { tool_name: "browser", status: "ok", result: JSON.stringify({ type: "ceyo.browser_login" }) } }])).toBe(true);
  });
  it("does not confuse a failed login attempt with a successful handoff", () => {
    expect(needsBrowserLogin([{ type: "agent.tool_result", part: { tool_name: "browser", status: "error", result: "Unavailable" } }])).toBe(false);
  });
});