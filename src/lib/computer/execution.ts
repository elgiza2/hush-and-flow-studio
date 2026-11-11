/** Pure helpers for the cloud computer's streamed execution output. */
export type ComputerLanguage = "python" | "javascript" | "bash";

const MAX_OUTPUT = 8000;

export function normalizeLanguage(raw: unknown): ComputerLanguage {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "js" || v === "javascript" || v === "node" || v === "typescript" || v === "ts") return "javascript";
  if (v === "bash" || v === "sh" || v === "shell") return "bash";
  return "python";
}

/** Turns the NDJSON event stream into one readable tool result. */
export function formatExecution(ndjson: string): { ok: boolean; output: string } {
  const out: string[] = [];
  let error = "";
  let images = 0;
  for (const line of ndjson.split("\n")) {
    if (!line.trim()) continue;
    let ev: any;
    try { ev = JSON.parse(line); } catch { continue; }
    if (ev.type === "stdout" || ev.type === "stderr") out.push(String(ev.text ?? ""));
    else if (ev.type === "result") {
      if (ev.png || ev.jpeg || ev.svg) images++;
      else if (ev.text) out.push(`${ev.text}\n`);
    } else if (ev.type === "error") {
      const tb = String(ev.traceback ?? "").split("\n").slice(-4).join("\n");
      error = `${ev.name ?? "Error"}: ${ev.value ?? ""}${tb ? `\n${tb}` : ""}`;
    }
  }
  let text = out.join("").trim();
  if (images) text += `${text ? "\n" : ""}[${images} chart/image produced; describe it or save it to a file]`;
  if (error) text += `${text ? "\n" : ""}${error}`;
  if (!text) text = error ? error : "(no output — print the values you need)";
  if (text.length > MAX_OUTPUT) text = `${text.slice(0, MAX_OUTPUT)}\n…[truncated]`;
  return { ok: !error, output: text };
}
