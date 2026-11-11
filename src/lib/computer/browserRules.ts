import { z } from "zod";

export const browserAction = z.object({
  action: z.enum(["navigate", "read", "click", "fill", "press", "login", "look", "show_user", "click_at", "type_text"]),
  x: z.number().int().min(0).max(4000).optional(),
  y: z.number().int().min(0).max(4000).optional(),
  question: z.string().max(1000).optional(),
  url: z.string().url().optional(),
  selector: z.string().min(1).max(500).optional(),
  value: z.string().max(10000).optional(),
});
export function publicBrowserUrl(raw: string) {
  const url = new URL(raw);
  const host = url.hostname.toLowerCase();
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || !host.includes(".") || host.includes(":") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) throw new Error("Use a public website URL");
  return url.href;
}