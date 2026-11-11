/** Instant trigger links: each routine gets an unguessable HMAC link so outside services can wake it immediately. */
export async function routineHookSignature(secret: string, routineId: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`routine-hook:${routineId}`)));
  return Array.from(mac.slice(0, 24), (b) => b.toString(16).padStart(2, "0")).join("");
}
export function sameSignature(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
