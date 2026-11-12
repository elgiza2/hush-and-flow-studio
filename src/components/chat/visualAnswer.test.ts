import { describe, expect, it } from "vitest";
import { splitVisualAnswer } from "./visualAnswer";

describe("inline visual answers", () => {
  it("keeps an ordinary Markdown table intact", () => {
    const text = "| Item | Value |\n| --- | --- |\n| A | 42 |";
    expect(splitVisualAnswer(text)).toEqual([{ kind: "markdown", content: text }]);
  });
  it("separates completed drawings from surrounding text", () => {
    expect(splitVisualAnswer("Summary\n```widget\n<svg></svg>\n```\nNext")).toEqual([
      { kind: "markdown", content: "Summary\n" }, { kind: "widget", content: "<svg></svg>\n" }, { kind: "markdown", content: "\nNext" },
    ]);
  });
  it("does not expose unfinished streamed HTML", () => {
    expect(splitVisualAnswer("Summary\n```widget\n<script>partial")).toEqual([{ kind: "markdown", content: "Summary\n" }]);
  });
  it("does not execute ordinary HTML code examples", () => {
    const text = "```html\n<h2>Example</h2>\n```";
    expect(splitVisualAnswer(text)).toEqual([{ kind: "markdown", content: text }]);
  });
  it("supports multiple drawings and tilde fences", () => {
    expect(splitVisualAnswer("~~~widget\n<p>A</p>\n~~~\n```widget\n<p>B</p>\n```").filter(p => p.kind === "widget").map(p => p.content)).toEqual(["<p>A</p>\n", "<p>B</p>\n"]);
  });
});