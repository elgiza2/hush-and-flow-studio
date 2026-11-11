import { getProviderKey } from "@/lib/keys/providerKey";
import { browserAction, publicBrowserUrl } from "./browserRules";
import type { Computer } from "./e2b.server";

const API = "https://api.browserbase.com/v1";
export function createBotBrowser(userId: string, botId: string, computer: Computer) {
  let session: { id: string; connectUrl: string; key: string; projectId: string } | null = null;
  const token = crypto.randomUUID();
  let claimed = false;
  let handoff = false;
  async function api(key: string, path: string, body?: object) {
    const res = await fetch(`${API}${path}`, { method: body ? "POST" : "GET", headers: { "X-BB-API-Key": key, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (!res.ok) throw new Error(`Browser unavailable (${res.status})`);
    return res.json();
  }
  async function open() {
    if (session) return session;
    const key = await getProviderKey("browserbase");
    if (!key) throw new Error("Browser is not configured");
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data, error } = await db.rpc("claim_agent_browser", { p_user: userId, p_bot: botId, p_token: token });
    if (error) throw new Error(error.message);
    const row = data?.[0];
    if (!row) throw new Error("This bot's browser is busy or awaiting your login; try again after it finishes");
    claimed = true;
    let projectId = row.project_id || process.env.BROWSERBASE_PROJECT_ID;
    if (!projectId) {
      const projects = await api(key, "/projects");
      if (!Array.isArray(projects) || projects.length !== 1) throw new Error("Select the Browserbase project in server settings");
      projectId = projects[0].id;
    }
    if (!projectId) throw new Error("Browser project unavailable");
    const contextId = row.context_id || (await api(key, "/contexts", { projectId })).id;
    if (!contextId) throw new Error("Browser context unavailable");
    const saved = await db.from("agent_browser_contexts").update({ context_id: contextId, project_id: projectId }).eq("bot_id", botId).eq("user_id", userId).eq("lease_token", token);
    if (saved.error) throw new Error(saved.error.message);
    const created = await api(key, "/sessions", { projectId, browserSettings: { context: { id: contextId, persist: true } }, timeout: 600 });
    if (!created.id || !created.connectUrl) throw new Error("Browser session unavailable");
    session = { id: created.id, connectUrl: created.connectUrl, key, projectId };
    const setup = await computer.run("%pip -q install playwright", "python", 120000);
    if (!setup.ok) throw new Error("Could not prepare browser controls");
    return session;
  }
  return {
    async run(raw: unknown) {
      const input = browserAction.parse(raw);
      if (handoff) throw new Error("Wait for the user to finish signing in");
      if (input.url) input.url = publicBrowserUrl(input.url);
      if ((input.action === "navigate" || input.action === "login") && !input.url) throw new Error("Website URL required");
      if (["click", "fill", "press"].includes(input.action) && !input.selector) throw new Error("Use a selector from the last page observation");
      const current = await open();
      const payload = JSON.stringify({ ...input, connect: current.connectUrl });
      // Provider credentials are passed only to the isolated computer, never emitted in chat.
      const result = await computer.run(`import json\nfrom playwright.async_api import async_playwright\na=json.loads(${JSON.stringify(payload)})\nasync with async_playwright() as p:\n b=await p.chromium.connect_over_cdp(a['connect'])\n c=b.contexts[0]\n page=c.pages[0] if c.pages else await c.new_page()\n if a['action'] in ['navigate','login']: await page.goto(a['url'], wait_until='domcontentloaded', timeout=30000)\n elif a['action']=='click': await page.locator(a['selector']).first.click(timeout=10000)\n elif a['action']=='fill': await page.locator(a['selector']).first.fill(a.get('value',''),timeout=10000)\n elif a['action']=='press': await page.locator(a['selector']).first.press(a.get('value','Enter'),timeout=10000)\n print(json.dumps({'url':page.url,'text':(await page.locator('body').inner_text())[:12000],'controls':await page.locator('input,button,a,textarea,select').evaluate_all("els => els.slice(0,80).map(e => ({tag:e.tagName,id:e.id,name:e.name,type:e.type,text:(e.innerText||e.getAttribute('aria-label')||'').slice(0,100)}))")},ensure_ascii=False))\n await b.close()`, "python", 60000);
      if (!result.ok) throw new Error("Browser action failed. Observe again before repeating any write action.");
      if (input.action === "login") {
        const debug = await api(current.key, `/sessions/${current.id}/debug`);
        handoff = true;
        return JSON.stringify({ type: "ceyo.browser_login", url: debug.debuggerFullscreenUrl, instruction: "Give this private, temporary browser link only to this user. They sign in themselves. Stop and wait; never ask for their password or bypass verification. Context is saved when session ends (up to 10 minutes)." });
      }
      return result.output;
    },
    async close() {
      if (handoff) return; // provider timeout persists context; lease expires safely
      if (session) await api(session.key, `/sessions/${session.id}`, { status: "REQUEST_RELEASE", projectId: session.projectId }).catch(() => undefined);
      if (claimed) {
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        await db.from("agent_browser_contexts").update({ lease_until: null, lease_token: null }).eq("bot_id", botId).eq("user_id", userId).eq("lease_token", token);
      }
    },
  };
}