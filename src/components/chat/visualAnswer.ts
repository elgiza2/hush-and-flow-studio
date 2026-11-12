export type AnswerPart = { kind: "markdown" | "widget"; content: string };

/** Keep unfinished visual fences private until the streamed document is complete. */
export function splitVisualAnswer(text: string): AnswerPart[] {
  const parts: AnswerPart[] = [];
  const fences = /^(`{3,}|~{3,})widget[^\S\n]*\r?\n/gm;
  let cursor = 0;
  for (let match = fences.exec(text); match; match = fences.exec(text)) {
    const start = match.index;
    // A widget-looking line inside an ordinary code example is not a widget.
    const preceding = text.slice(cursor, start);
    const ordinaryFences = preceding.match(/^\s*(?:`{3,}|~{3,})[^\n]*$/gm) || [];
    if (ordinaryFences.length % 2) continue;
    if (start > cursor) parts.push({ kind: "markdown", content: preceding });
    const bodyStart = fences.lastIndex;
    const close = new RegExp(`^${match[1][0]}{${match[1].length},}[^\\S\\n]*$`, "gm");
    close.lastIndex = bodyStart;
    const ending = close.exec(text);
    if (!ending) {
      cursor = text.length;
      break;
    }
    parts.push({ kind: "widget", content: text.slice(bodyStart, ending.index) });
    cursor = close.lastIndex;
    fences.lastIndex = cursor;
  }
  if (cursor < text.length) parts.push({ kind: "markdown", content: text.slice(cursor) });
  return parts;
}

export const VISUAL_ANSWER_PROMPT = `Organize substantive answers for reading inside chat: short paragraphs, meaningful headings and lists, not walls of text. Use Markdown tables for comparisons and structured rows. For charts, diagrams, timelines, dashboards, interactive calculators or custom visual layouts, draw the answer inline using a fenced block labelled widget containing self-contained HTML, SVG or canvas. Include a concise textual takeaway outside the widget for accessibility. Never show the widget source as the answer. Ordinary coding requests still use normal code fences.
The widget runs in an isolated frame with no access to accounts, cookies, storage or the parent page. No external scripts, styles, fetch requests, remote assets or navigation. Use real verified values; label estimates. Responsive width:100%, readable labels, no fixed page width. Built-in classes: stack, row, grid, stat, badge, muted, bar, primary; normal headings, lists, tables and form controls are styled. Use CSS variables --ink, --muted, --paper, --soft, --line, --accent. English interface labels. Buttons must either update the local view or call megsy.send("a short request") / use data-send="a short request" to send an explicit follow-up through chat. These follow-ups are requests, never proof that an action was completed. Do not ask for passwords or secrets in a widget. Close the fence only after the complete fragment. Prefer one useful visual rather than repeating its contents as prose.`;