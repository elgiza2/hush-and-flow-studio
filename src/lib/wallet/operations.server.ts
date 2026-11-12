/** Durable reservations: an ambiguous transfer must never be replayed automatically. */
export async function guardedWalletAction(userId: string, key: string, payload: string, execute: () => Promise<Response>): Promise<Response> {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload))), (b) => b.toString(16).padStart(2, "0")).join("");
  const headers = { "Cache-Control": "no-store" };
  const { error: claimError } = await db.from("wallet_operations").insert({ user_id: userId, operation_key: key, request_hash: hash });
  if (claimError) {
    if (claimError.code !== "23505") return Response.json({ error: "Transfer unavailable. Please try again later." }, { status: 503, headers });
    const { data: old, error } = await db.from("wallet_operations").select("request_hash,status,result").eq("user_id", userId).eq("operation_key", key).maybeSingle();
    if (error || !old || old.request_hash !== hash) return Response.json({ error: "Transfer confirmation does not match." }, { status: 409, headers });
    if (old.status === "completed") return Response.json(old.result, { headers });
    return Response.json({ error: "This transfer is already being processed or needs review. Check its transaction before trying again." }, { status: 409, headers });
  }
  try {
    const response = await execute();
    const result = await response.clone().json();
    const { error } = await db.from("wallet_operations").update({ status: response.ok ? "completed" : "unknown", result }).eq("user_id", userId).eq("operation_key", key);
    if (error) return Response.json({ error: "Transfer status could not be saved. Check your transaction before trying again." }, { status: 409, headers });
    return response;
  } catch {
    await db.from("wallet_operations").update({ status: "unknown" }).eq("user_id", userId).eq("operation_key", key);
    return Response.json({ error: "Transfer status is uncertain. Check your transaction before trying again." }, { status: 409, headers });
  }
}
