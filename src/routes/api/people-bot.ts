import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { botsToAnswer } from "@/lib/people/mentions";
import { runAgentLoop } from "@/lib/ceyo/agentLoop.server";
import { isUsageExhausted } from "@/lib/ceyo/usage";

const input = z.object({ threadId: z.string().uuid(), messageId: z.string().uuid() });
const noStore = { "Cache-Control": "no-store" };

/** Lets every bot in a people chat answer a member's message (an @mention narrows it). Replies are written by the server. */
async function handle(request: Request) {
  const { authenticate } = await import("@/lib/ceyo/auth.server");
  const auth = await authenticate(request).catch(() => null);
  if (!auth) return Response.json({ error: "Please sign in" }, { status: 401, headers: noStore });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400, headers: noStore });
  const { threadId, messageId } = parsed.data;

  // Read through the caller's own session so membership is enforced by the database.
  const { data: msg } = await auth.db.from("people_messages").select("id,thread_id,sender_id,content").eq("id", messageId).eq("thread_id", threadId).maybeSingle();
  if (!msg || msg.sender_id !== auth.userId) return Response.json({ error: "Not found" }, { status: 404, headers: noStore });
  const { data: info } = await auth.db.rpc("people_thread_info", { p_thread: threadId });
  const bots = botsToAnswer(msg.content, (info?.bots || []) as { id: string; name: string }[]);
  if (!bots.length) return Response.json({ replied: 0 }, { headers: noStore });

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: recent } = await auth.db.from("people_messages").select("sender_id,bot_id,content,created_at").eq("thread_id", threadId).order("created_at", { ascending: false }).limit(20);
  const members = (info?.members || []) as { id: string; username: string | null; displayName: string | null }[];
  const nameOf = (m: { sender_id: string | null; bot_id: string | null }) => m.bot_id
    ? ((info?.bots || []) as { id: string; name: string }[]).find((b) => b.id === m.bot_id)?.name || "Bot"
    : (() => { const p = members.find((x) => x.id === m.sender_id); return p?.displayName || (p?.username ? `@${p.username}` : "User"); })();
  const lines = (recent || []).reverse().map((m) => `${nameOf(m)}: ${m.content}`);

  let replied = 0;
  for (const bot of bots) {
    const { data: full } = await supabaseAdmin.from("bots").select("id,name,instructions").eq("id", bot.id).maybeSingle();
    if (!full) continue;
    // Same loop as one-to-one chats: web tools plus the bot's own cloud computer.
    const system = `You are ${full.name}, one of several bots taking part in a group chat with real people.\n${full.instructions || ""}\nReply briefly from your own role. Other bots may already have answered in the chat above: add something new instead of repeating them. Do not prefix your reply with your name. Use your tools (web search, reading pages, run_code on your cloud computer) when the message needs fresh facts, calculations or files; claim you ran something only after a successful tool result.`;
    let text = "";
    try {
      text = (await runAgentLoop(system, [
        { role: "user", content: `Recent chat (context only):\n${lines.join("\n")}` },
        { role: "user", content: msg.content },
      ], () => {}, request.signal, async () => [], { usageOwner: auth.userId, maxSteps: 5 })).trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (isUsageExhausted(message) || message.startsWith("Could not check usage")) return Response.json({ error: message }, { status: 402, headers: noStore });
      if (message === "AI is not configured") return Response.json({ error: "The reply model is not configured" }, { status: 503, headers: noStore });
      continue;
    }
    if (!text) continue;
    const { error } = await supabaseAdmin.from("people_messages").insert({ thread_id: threadId, bot_id: full.id, sender_id: null, content: text.slice(0, 8000) });
    if (!error) { replied++; lines.push(`${full.name}: ${text}`); }
  }
  return Response.json({ replied }, { headers: noStore });
}

export const Route = createFileRoute("/api/people-bot")({ server: { handlers: { POST: ({ request }) => handle(request) } } });
