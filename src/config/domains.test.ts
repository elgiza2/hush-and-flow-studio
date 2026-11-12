import { describe, expect, it } from "vitest";
import { landingRedirect, showsLanding, surfaceFor, webAppOrigin } from "./domains";

describe("domain split", () => {
  it("ceyo.si is the landing", () => expect(surfaceFor("ceyo.si")).toBe("landing"));
  it("ceyo.app is the landing", () => expect(surfaceFor("ceyo.app")).toBe("landing"));
  it("www.ceyo.app is the landing", () => expect(surfaceFor("www.ceyo.app")).toBe("landing"));
  it("web.ceyo.si is the web app", () => expect(surfaceFor("web.ceyo.si")).toBe("web"));
  it("app.ceyo.si is the Android app", () => expect(surfaceFor("app.ceyo.si")).toBe("android"));
  it("the landing page shows on ceyo.app", () => expect(showsLanding("ceyo.app")).toBe(true));
  it("the landing page never shows in the Android app", () => expect(showsLanding("app.ceyo.si", "?landing=1")).toBe(false));
  it("the landing page never shows in the web app", () => expect(showsLanding("web.ceyo.si", "?landing=1")).toBe(false));
  it("previews can open the landing page", () => expect(showsLanding("localhost:8080", "?landing=1")).toBe(true));
  it("the landing home stays on ceyo.si", () => expect(landingRedirect("ceyo.si", "/")).toBeNull());
  it("app paths on ceyo.app move to web.ceyo.si", () => expect(landingRedirect("ceyo.app", "/settings", "?a=1")).toBe("https://web.ceyo.si/settings?a=1"));
  it("legal pages stay on ceyo.si", () => expect(landingRedirect("ceyo.si", "/privacy")).toBeNull());
  it("the web app never redirects", () => expect(landingRedirect("web.ceyo.si", "/settings")).toBeNull());
  it("landing buttons open web.ceyo.si", () => expect(webAppOrigin("ceyo.app", "https://ceyo.app")).toBe("https://web.ceyo.si"));
});
