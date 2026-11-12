/** Free built-in background jobs (replaces Inngest).
 *  A job is a persisted agent_jobs row. It is started by a signed request to
 *  /api/public/ceyo-jobs on this same app, and any job left queued is picked up
 *  again by the scheduled routines endpoint. A job is claimed atomically
 *  (queued → running) so it never runs twice, and its result is delivered once
 *  with the job id as the message id. */
import { runAgentLoop } from "./agentLoop.server";
import type { LoopEvent } from "./agentLoop.server";
import { needsBrowserLogin } from "./taskOutcome";

export function backgroundReady(): boolean {
  return Boolean(process.env.LOVABLE_CRON_SECRET);
}

export async function runJob(jobId: string): Promise<string> {
  if (!/^[a-f0-9-]{36}$/i.test(jobId)) throw new Error("Invalid job");
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { data: job, error: claimError } = await db
    .from("agent_jobs")
    .update({ status: "running" })
    .eq("id", jobId)
    .eq("status", "queued")
    .select("*")
    .maybeSingle();
  if (claimError) throw new Error("Could not claim background task");
  if (!job) return "skipped";
  let cursor = job.cursor_at;
  const poll = async () => {
    const { data } = await db.from("messages").select("content,created_at").eq("conversation_id", job.conversation_id).eq("user_id", job.user_id).eq("role", "user").gt("created_at", cursor).order("created_at");
    if (data?.length) cursor = data[data.length - 1].created_at;
    return (data || []).map((m) => m.content);
  };
  try {
    const transcript: LoopEvent[] = [];
    const text = await runAgentLoop(
      job.system_prompt + "\nComplete this background task and export produced files. Only perform account actions explicitly authorized in the user's goal. If login is required, hand off and stop. No workspace or integration API actions are available; do not claim them.",
      [{ role: "user", content: job.goal }], (event) => { if (event.type !== "agent.reasoning") transcript.push(event); }, AbortSignal.timeout(8 * 60000), poll, { usageOwner: job.user_id, botId: job.bot_id, maxSteps: 40 },
    );
    if (!text.trim()) throw new Error("No completed answer");
    const { error } = await db.from("messages").upsert(
      { id: job.id, user_id: job.user_id, conversation_id: job.conversation_id, bot_id: job.bot_id, role: "assistant", content: text, metadata: { fromJob: job.id, transcript: transcript as never } },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (error) throw new Error(error.message);
    const waiting = needsBrowserLogin(transcript);
    const { error: stateError } = await db.from("agent_jobs").update({ status: waiting ? "failed" : "completed", result: text, error: waiting ? "Sign-in required; send the task again after login" : null }).eq("id", job.id).eq("status", "running");
    if (stateError) throw new Error("Could not save task completion");
    await db.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", job.conversation_id);
    if (waiting) return "login_required";
    // Ring the user the moment the task is done; the bot opens the call with the result.
    const { error: callError } = await db.from("agent_calls").upsert({ id: job.id, user_id: job.user_id, bot_id: job.bot_id, conversation_id: job.conversation_id, kind: "voice", status: "ringing", reason: `You finished the task the user gave you: "${job.goal.slice(0, 200)}". Tell them it's done and summarize the result briefly: ${text.slice(0, 900)}` }, { onConflict: "id", ignoreDuplicates: true });
    if (callError) console.error("Task finished, but its completion call could not be saved");
    return "completed";
  } catch (e) {
    const { error: failureError } = await db.from("agent_jobs").update({ status: "failed", error: "Task stopped. Review its result before trying again." }).eq("id", job.id).eq("status", "running");
    if (failureError) console.error("Could not save background failure");
    throw e;
  }
}

/** Picks up jobs that were queued but never started (e.g. the trigger was lost). */
export async function runStaleJobs(): Promise<{ id: string; status: string }[]> {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  // Never blindly replay abandoned work: an external side effect may have happened.
  const expired = new Date(Date.now() - 15 * 60_000).toISOString();
  const { error: recoveryError } = await db.from("agent_jobs").update({ status: "failed", error: "Task interrupted. Review any delivered result before starting it again." }).eq("status", "running").lt("updated_at", expired);
  if (recoveryError) throw new Error("Could not recover interrupted tasks");
  const before = new Date(Date.now() - 60_000).toISOString();
  const { data } = await db.from("agent_jobs").select("id").eq("status", "queued").lt("created_at", before).limit(3);
  const out: { id: string; status: string }[] = [];
  for (const j of data || []) {
    try { out.push({ id: j.id, status: await runJob(j.id) }); } catch { out.push({ id: j.id, status: "failed" }); }
  }
  return out;
}

export async function startLongTask(payload: { origin: string; system: string; goal: string; userId: string; conversationId: string; botId: string | null; cursorAt: string }): Promise<string> {
  const secret = process.env.LOVABLE_CRON_SECRET;
  if (!secret) throw new Error("Background jobs are not configured");
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { data: conv } = await db.from("conversations").select("id").eq("id", payload.conversationId).eq("user_id", payload.userId).maybeSingle();
  if (!conv) throw new Error("Conversation not found");
  const { data: job, error } = await db.from("agent_jobs").insert({ user_id: payload.userId, conversation_id: payload.conversationId, bot_id: payload.botId, goal: payload.goal, system_prompt: payload.system, cursor_at: payload.cursorAt }).select("id").single();
  if (error || !job) throw new Error("Could not save job");
  // Fire the signed trigger; if it is lost, runStaleJobs picks the job up.
  void fetch(`${payload.origin}/api/public/ceyo-jobs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: job.id }),
  }).catch(() => undefined);
  return job.id;
}
