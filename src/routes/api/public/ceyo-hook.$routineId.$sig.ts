import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// External services (Shopify, forms, Zapier...) POST here to run a routine immediately instead of waiting for the 5-minute tick.
export const Route = createFileRoute("/api/public/ceyo-hook/$routineId/$sig")({ server: { handlers: { POST: async ({ params, request }) => {
  const secret = process.env.LOVABLE_CRON_SECRET;
  if (!secret || !z.string().uuid().safeParse(params.routineId).success) return new Response("Not found", { status: 404 });
  const { routineHookSignature, sameSignature } = await import("@/lib/ceyo/routineHook");
  if (!sameSignature(await routineHookSignature(secret, params.routineId), params.sig)) return new Response("Not found", { status: 404 });
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { data } = await db.from("agent_routines").update({ next_run_at: new Date().toISOString() }).eq("id", params.routineId).eq("active", true).select("id").maybeSingle();
  if (!data) return new Response("Not found", { status: 404 });
  // Wake the runner now; the scheduled tick is the fallback if this is lost.
  void fetch(new URL("/api/public/ceyo-routines", request.url), { method: "POST", headers: { Authorization: `Bearer ${secret}` } }).catch(() => undefined);
  return Response.json({ queued: true });
} } } });
