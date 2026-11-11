/** Server-only E2B cloud computer. Each agent run lazily opens one isolated
 *  sandbox, reuses it for every run_code step (files and variables persist
 *  within the task) and kills it when the run ends. Model code never runs in
 *  the app process; without an E2B key every call fails closed. */
import { getProviderKey } from "@/lib/keys/providerKey";
import { formatExecution, type ComputerLanguage } from "./execution";

const API = "https://api.e2b.app";
const TEMPLATE = "code-interpreter-v1";
/** Idle sandbox lifetime (seconds); the run kills it earlier when it finishes. */
const SANDBOX_TTL_S = 600;

type Sandbox = { id: string; token?: string; domain: string; key: string };

export type Computer = {
  run: (code: string, language?: ComputerLanguage, timeoutMs?: number) => Promise<{ ok: boolean; output: string }>;
  readFile: (path: string) => Promise<Uint8Array>;
  prepareMedia: () => Promise<{ ok: boolean; output: string }>;
  close: () => Promise<void>;
};

async function openSandbox(key: string): Promise<Sandbox> {
  const res = await fetch(`${API}/sandboxes`, {
    method: "POST",
    headers: { "X-API-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ templateID: TEMPLATE, timeout: SANDBOX_TTL_S, secure: true }),
  });
  if (!res.ok) throw new Error(`The cloud computer could not start (${res.status}).`);
  const j: any = await res.json();
  if (!j?.sandboxID) throw new Error("The cloud computer did not return a session.");
  return { id: j.sandboxID, token: j.envdAccessToken || undefined, domain: j.domain || "e2b.app", key };
}

/** Creates a lazy computer session; nothing starts until the first run. */
export function createComputer(): Computer {
  let box: Promise<Sandbox> | null = null;
  const computer: Computer = {
    async run(code, language = "python", timeoutMs = 60_000) {
      const key = await getProviderKey("e2b");
      if (!key) return { ok: false, output: "The cloud computer is unavailable: no E2B key is configured." };
      box ??= openSandbox(key);
      let sb: Sandbox;
      try {
        sb = await box;
      } catch (e) {
        box = null;
        return { ok: false, output: e instanceof Error ? e.message : "The cloud computer could not start." };
      }
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), Math.min(Math.max(timeoutMs, 1000), 120_000));
      try {
        const res = await fetch(`https://49999-${sb.id}.${sb.domain}/execute`, {
          method: "POST",
          signal: ctrl.signal,
          headers: { "Content-Type": "application/json", ...(sb.token ? { "X-Access-Token": sb.token } : {}) },
          body: JSON.stringify({ code, language }),
        });
        if (!res.ok) return { ok: false, output: `The cloud computer refused the code (${res.status}).` };
        return formatExecution(await res.text());
      } catch (e: any) {
        if (ctrl.signal.aborted) return { ok: false, output: "The code took too long and was stopped. Make it smaller or faster." };
        return { ok: false, output: `The cloud computer failed: ${String(e?.message || e).slice(0, 200)}` };
      } finally {
        clearTimeout(timer);
      }
    },
    async prepareMedia() {
      return computer.run("%pip -q install imageio-ffmpeg\nimport imageio_ffmpeg,os\nff=imageio_ffmpeg.get_ffmpeg_exe()\nos.makedirs('/home/user/.local/bin',exist_ok=True)\nlink='/home/user/.local/bin/ffmpeg'\nif not os.path.exists(link): os.symlink(ff,link)\nprint('ffmpeg ready:',ff)", "python", 120000);
    },
    async readFile(path) {
      if (!path.startsWith("/home/user/") || path.split("/").includes("..")) throw new Error("Export files only from /home/user/");
      const pending = box;
      if (!pending) throw new Error("Run code to create the file first");
      const sb = await pending;
      const res = await fetch(`https://49983-${sb.id}.${sb.domain}/files?path=${encodeURIComponent(path)}`, { headers: { ...(sb.token ? { "X-Access-Token": sb.token } : {}) }, signal: AbortSignal.timeout(60000) });
      if (!res.ok || !res.body) throw new Error("Produced file unavailable");
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = []; let size = 0;
      for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 20971520) { await reader.cancel(); throw new Error("File exceeds 20 MB; compress or split it"); } chunks.push(value); }
      if (!size) throw new Error("Produced file is empty");
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return bytes;
    },
    async close() {
      const pending = box;
      box = null;
      if (!pending) return;
      const sb = await pending.catch(() => null);
      if (sb) await fetch(`${API}/sandboxes/${sb.id}`, { method: "DELETE", headers: { "X-API-Key": sb.key } }).catch(() => {});
    },
  };
  return computer;
}

/** One-shot run in a fresh sandbox that is killed right after. */
export async function runOnce(code: string, language: ComputerLanguage = "python", timeoutMs = 60_000) {
  const computer = createComputer();
  try {
    return await computer.run(code, language, timeoutMs);
  } finally {
    await computer.close();
  }
}
