// Centralized error reporting + user-facing message sanitization.
// - Strips internal provider names from any error before showing it to users.
// - Sends the original (still sanitized) error to the `report-error` edge
//   function which logs it for the admin and (best-effort) emails them.
import { supabase } from "@/integrations/supabase/client";

const PROVIDER_PATTERNS: Array<[RegExp, string]> = [
  [/lovable\s*ai\s*gateway/gi, "the service"],
  [/lovable\s*ai/gi, "the service"],
  [/lovable\.dev/gi, "the service"],
  [/openai|gpt-?\d+(\.\d+)?|chatgpt/gi, "the service"],
  [/anthropic|claude(-[a-z0-9.-]+)?/gi, "the service"],
  [/gemini|google\s*ai|vertex/gi, "the service"],
  [/mistral|llama|grok|xai/gi, "the service"],
  [/dashscope|alibaba|qwen[-a-z0-9.]*|tongyi/gi, "the service"],
  [/openrouter|replicate|fal\.ai|fireworks|together\.ai|deepinfra|groq/gi, "the service"],
  [
    /runway|pika|luma|kling|minimax|veo|sora|stability|stable\s*diffusion|midjourney/gi,
    "the service",
  ],
  [/serper|firecrawl|pexels|tavily|brave\s*search/gi, "the service"],
  [/supabase|postgres|pgsql/gi, "the database"],
  [/resend|sendgrid|mailgun|postmark/gi, "the email service"],
  [/e2b|sandbox\.dev/gi, "the runtime"],
  [/edge\s*function(s)?( returned)?( a)?( non-?2xx)?( status)?( code)?/gi, "the service"],
  [/functionshttperror|functionsfetcherror|functionsrelayerror/gi, "the service"],
  [/sk-[a-z0-9-]{20,}/gi, "[redacted]"],
  [/bearer\s+[a-z0-9._-]+/gi, "[redacted]"],
];

/** Replace internal provider/SDK names so users only see neutral wording. */
export function sanitizeErrorMessage(input: unknown): string {
  const raw =
    input instanceof Error
      ? input.message
      : typeof input === "string"
        ? input
        : (() => {
            try {
              return JSON.stringify(input);
            } catch {
              return String(input);
            }
          })();
  let out = (raw ?? "").toString().slice(0, 1000);
  for (const [re, rep] of PROVIDER_PATTERNS) out = out.replace(re, rep);
  return out;
}

/**
 * Translate any error into a short, generic, English message safe to show
 * end-users. Specific known codes (insufficient credits, rate-limit, network,
 * auth) get tailored copy; everything else collapses to a single generic line.
 */
export function friendlyUserMessage(
  input: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const s = sanitizeErrorMessage(input).toLowerCase();
  if (!s) return fallback;
  if (/subscription_required|upgrade_required|subscription required|subscribe.*first/.test(s)) return "An active subscription is required. Choose a plan to continue.";
  if (s.includes("insufficient") || s.includes("credit") || s.includes("402")) {
    return "You're out of credits. Top up to continue.";
  }
  if (s.includes("429") || s.includes("rate") || s.includes("too many")) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (s.includes("401") || s.includes("403") || s.includes("unauthor")) {
    return "You're not signed in or don't have access to this action.";
  }
  if (
    s.includes("network") ||
    s.includes("fetch") ||
    s.includes("timeout") ||
    s.includes("econn") ||
    s.includes("offline")
  ) {
    return "Network issue. Check your connection and try again.";
  }
  if (s.includes("non-2xx") || s.includes("the service") || s.includes("status code")) {
    return "The service is busy right now. Please try again in a moment.";
  }
  if (s.includes("empty response") || s.includes("could not parse")) {
    return "We couldn't complete this. Please rephrase your request and try again.";
  }
  if (s.includes("duplicate key") || s.includes("already exists")) {
    return "That already exists.";
  }
  if (s.includes("abort")) {
    return "That was interrupted. Please try again.";
  }
  if (/\b5\d\d\b/.test(s) || s.includes("internal server") || s.includes("unavailable") || s.includes("bad gateway")) {
    return "The service is busy right now. Please try again in a moment.";
  }
  return fallback;
}

/** Markers of raw technical errors: status codes, JSON, code exceptions, database or transport internals. */
const TECHNICAL = /\[\d{3}\]|\b[45]\d\d\b|[{}<>]|https?:\/\/|\b(type|reference|syntax|range)error\b|\bundefined\b|\bnull\b|\bnan\b|failed to fetch|networkerror|load failed|\bjwt\b|pgrst|violates|duplicate key|constraint|relation "|column "|unexpected token|\bjson\b|econn|etimedout|timed? ?out|internal server|bad gateway|exception|cannot read prop|is not a function|stack|the database|the service|non-2xx|abort/i;

/**
 * Text for an error shown inside the app. Clear messages written for people
 * pass through; raw technical errors become one plain sentence.
 */
export function userErrorText(
  input: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const text = sanitizeErrorMessage(input).trim();
  if (!text || text === "{}" || text === "[object Object]") return fallback;
  if (text.length > 180 || TECHNICAL.test(text)) return friendlyUserMessage(text, fallback);
  return text;
}

export interface ReportErrorOptions {
  source: string;
  context?: Record<string, unknown>;
  route?: string;
}

/** Fire-and-forget error report to the admin. Safe to await or ignore. */
export async function reportError(error: unknown, opts: ReportErrorOptions): Promise<void> {
  try {
    const message = sanitizeErrorMessage(error);
    const raw = error instanceof Error && error.stack ? sanitizeErrorMessage(error.stack) : null;
    await supabase.functions.invoke("report-error", {
      body: {
        source: opts.source,
        route: opts.route ?? (typeof window !== "undefined" ? window.location.pathname : null),
        message,
        raw_error: raw,
        context: opts.context ?? {},
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      },
    });
  } catch {
    // never let reporting itself throw
  }
}
