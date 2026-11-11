/** @doc Long-task support for the agent loop: tool-failure reflection and context compaction. */
type Msg = { role: string; content?: string | null; tool_calls?: any[]; tool_call_id?: string; name?: string };

export const MAX_SAME_FAILURES = 3;

/** Tracks repeated failures of the same tool+input so the agent changes approach instead of looping. */
export function createFailureTracker() {
  const counts = new Map<string, number>();
  return {
    record(name: string, args: unknown, ok: boolean): { attempt: number; note: string | null; giveUp: boolean } {
      const key = `${name}:${JSON.stringify(args ?? {}).slice(0, 500)}`;
      if (ok) { counts.delete(key); return { attempt: 0, note: null, giveUp: false }; }
      const attempt = (counts.get(key) ?? 0) + 1;
      counts.set(key, attempt);
      if (attempt >= MAX_SAME_FAILURES) return { attempt, giveUp: true, note: `This exact action failed ${attempt} times. Do not repeat it. Use a different method, or tell the user honestly what blocked you.` };
      return { attempt, giveUp: false, note: `Self-check (attempt ${attempt}/${MAX_SAME_FAILURES}): read the error, find the cause, then change the code, selector or approach before retrying. If on a website, use look to see the page first.` };
    },
  };
}

/** Shrinks old tool outputs when the transcript grows, keeping the latest ones intact. */
export function compactMessages(messages: Msg[], budget = 60_000, keepRecent = 6): Msg[] {
  const size = () => messages.reduce((n, m) => n + (m.content?.length ?? 0), 0);
  if (size() <= budget) return messages;
  const toolIdx = messages.map((m, i) => (m.role === "tool" ? i : -1)).filter((i) => i >= 0);
  for (const i of toolIdx.slice(0, Math.max(0, toolIdx.length - keepRecent))) {
    const c = messages[i].content ?? "";
    if (c.length > 600) messages[i] = { ...messages[i], content: `${c.slice(0, 400)}\n…[older output shortened; rerun if needed]…\n${c.slice(-150)}` };
    if (size() <= budget) break;
  }
  return messages;
}

export const PLANNING_RULES = `Long-task method: for goals needing several steps, first call update_plan with short numbered steps, then work through them, calling update_plan again to mark steps done or revise. When a tool fails, diagnose and fix (different code, selector, or source) instead of repeating it. Never claim a step done without tool evidence.`;
