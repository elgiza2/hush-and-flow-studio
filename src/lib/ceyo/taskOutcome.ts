/** A successful browser handoff is not successful completion of the user's task. */
export function needsBrowserLogin(events: readonly Record<string, unknown>[]): boolean {
  return events.some((event) => {
    if (event.type !== "agent.tool_result") return false;
    const part = event.part as { tool_name?: string; status?: string; result?: string } | undefined;
    if (part?.tool_name !== "browser" || part.status !== "ok" || !part.result) return false;
    try { return JSON.parse(part.result).type === "ceyo.browser_login"; } catch { return false; }
  });
}