import { supabase } from "@/integrations/supabase/client";

export async function loadArtifact(id: string) {
  const { data, error } = await supabase.from("agent_artifacts").select("storage_path,mime,name").eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load this file");
  if (!data) return null;
  const result = await supabase.storage.from("agent-artifacts").download(data.storage_path);
  if (result.error || !result.data) throw new Error("Could not download this file");
  return { blob: result.data, mime: data.mime, name: data.name };
}