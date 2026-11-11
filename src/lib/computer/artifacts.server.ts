import { z } from "zod";
import type { Computer } from "./e2b.server";

export const artifactInput = z.object({ path: z.string().min(1).max(500), name: z.string().min(1).max(200).regex(/^[^/\\]+$/), mime: z.string().min(1).max(150) });
export async function exportArtifact(computer: Computer, userId: string, raw: unknown) {
  const input = artifactInput.parse(raw);
  const bytes = await computer.readFile(input.path);
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const id = crypto.randomUUID();
  const path = `${userId}/${id}/${input.name}`;
  const upload = await db.storage.from("agent-artifacts").upload(path, bytes, { contentType: input.mime });
  if (upload.error) throw new Error("Could not save produced file");
  const saved = await db.from("agent_artifacts").insert({ id, user_id: userId, name: input.name, mime: input.mime, size_bytes: bytes.byteLength, storage_path: path });
  if (saved.error) { await db.storage.from("agent-artifacts").remove([path]); throw new Error("Could not register produced file"); }
  return JSON.stringify({ type: "ceyo.file", id, name: input.name, mime: input.mime, size: bytes.byteLength, artifact: true, instruction: "File saved privately; the chat displays its download card." });
}