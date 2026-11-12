/** Which Ceyo surface this host serves. Browser-safe.
 *  ceyo.si and ceyo.app = landing (web only), web.ceyo.si = web app,
 *  app.ceyo.si = Android app shell (Google Play). Other hosts (preview, localhost) act as the web app. */
export type Surface = "landing" | "web" | "android";

export const DOMAINS = { landing: "ceyo.si", web: "web.ceyo.si", android: "app.ceyo.si" } as const;

/** Every host that serves the public landing pages. */
export const LANDING_HOSTS = ["ceyo.si", "ceyo.app"] as const;

const PUBLIC_PATHS = /^\/(terms|privacy|subscription-terms|about|contact|cookies|security|docs)(\/|$)/;

const bare = (host: string) => host.toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");

export function surfaceFor(host: string): Surface {
  const h = bare(host);
  if ((LANDING_HOSTS as readonly string[]).includes(h)) return "landing";
  if (h === DOMAINS.android) return "android";
  return "web";
}

/** True on a production Ceyo domain (landing, web or Android). */
export function isProductionHost(host: string): boolean {
  const h = bare(host);
  return (LANDING_HOSTS as readonly string[]).includes(h) || h === DOMAINS.web || h === DOMAINS.android;
}

/** Whether "/" should show the landing page. Previews can opt in with ?landing=1. */
export function showsLanding(host: string, search = ""): boolean {
  if (surfaceFor(host) === "landing") return true;
  return !isProductionHost(host) && new URLSearchParams(search).get("landing") === "1";
}

/** On a landing domain only "/" and public pages stay; app paths move to the web app with the same path. */
export function landingRedirect(host: string, path: string, search = ""): string | null {
  if (surfaceFor(host) !== "landing") return null;
  if (path === "/" || PUBLIC_PATHS.test(path)) return null;
  return `https://${DOMAINS.web}${path}${search}`;
}

/** Where landing buttons send people to use the app. */
export function webAppOrigin(host: string, currentOrigin: string): string {
  return isProductionHost(host) ? `https://${DOMAINS.web}` : currentOrigin;
}
