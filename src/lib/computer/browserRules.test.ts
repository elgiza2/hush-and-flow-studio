import { describe, expect, it } from "vitest";
import { publicBrowserUrl, browserAction } from "./browserRules";
describe("bot browser boundaries", () => {
  it("allows the user's Telegram web login", () => { expect(publicBrowserUrl("https://web.telegram.org/")).toBe("https://web.telegram.org/"); });
  it("rejects local network targets", () => { for (const url of ["http://localhost/", "http://app.localhost/", "http://127.0.0.1/", "http://192.168.1.1/", "file:///etc/passwd", "https://a.internal/"]) expect(() => publicBrowserUrl(url)).toThrow(); });
  it("rejects arbitrary browser scripts", () => { expect(browserAction.safeParse({ action: "evaluate", value: "process.env" }).success).toBe(false); });
});