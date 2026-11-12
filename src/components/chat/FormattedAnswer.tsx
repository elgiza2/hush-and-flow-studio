import { lazy, Suspense, type ReactNode } from "react";
import { ClientOnly } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { splitVisualAnswer } from "./visualAnswer";
import "@/styles/chat-previews.css";

const VisualWidget = lazy(() => import("./VisualWidget"));

export function FormattedAnswer({ text, onSend, decorate }: { text: string; onSend?: (text: string) => void; decorate?: (children: ReactNode) => ReactNode }) {
  return <div className="cx-formatted-answer">{splitVisualAnswer(text).map((part, i) => part.kind === "widget"
    ? <ClientOnly key={i}><Suspense fallback={<p role="status">Preparing visual…</p>}><VisualWidget html={part.content} onSend={onSend} /></Suspense></ClientOnly>
    : <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={{
      a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
      p: ({ children }) => <p>{decorate ? decorate(children) : children}</p>,
      li: ({ children }) => <li>{decorate ? decorate(children) : children}</li>,
      table: ({ children }) => <div className="cx-answer-table" role="region" aria-label="Answer table" tabIndex={0}><table>{children}</table></div>,
    }}>{part.content}</ReactMarkdown>)}</div>;
}