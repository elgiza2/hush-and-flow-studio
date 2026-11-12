import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

export const deleteOwnAccount = createServerFn({ method: "POST" })
  .inputValidator(z.object({ confirmation: z.literal("DELETE"), password: z.string().min(1).max(256) }))
  .handler(async ({ data }) => {
    const { authenticate } = await import("@/lib/ceyo/auth.server");
    const auth = await authenticate(getRequest());
    const { data: identity } = await auth.db.auth.getUser();
    if (!identity.user?.email) throw new Error("Please sign in again.");
    const { data: verified, error } = await auth.db.auth.signInWithPassword({ email: identity.user.email, password: data.password });
    if (error || verified.user?.id !== auth.userId) throw new Error("Incorrect password.");
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    // Storage objects must be removed before Supabase can delete an owning auth user.
    for (let batch = 0; batch < 100; batch++) {
      const { data: artifacts, error: listError } = await db.from("agent_artifacts").select("id,storage_path").eq("user_id", auth.userId).limit(100);
      if (listError) throw new Error("Could not read your files. Please try again.");
      if (!artifacts?.length) break;
      const { error: storageError } = await db.storage.from("agent-artifacts").remove(artifacts.map((a) => a.storage_path));
      if (storageError) throw new Error("Could not remove your files. Please try again.");
      const { error: rowError } = await db.from("agent_artifacts").delete().eq("user_id", auth.userId).in("id", artifacts.map((a) => a.id));
      if (rowError) throw new Error("Could not remove your files. Please try again.");
      if (batch === 99) throw new Error("File removal needs another attempt. Please try again.");
    }
    const { error: cleanupError } = await db.rpc("cleanup_account_data", { p_user: auth.userId });
    if (cleanupError) throw new Error("Could not finish removing account data. Please try again.");
    const { error: deleteError } = await db.auth.admin.deleteUser(auth.userId);
    if (deleteError) throw new Error("Could not finish deleting your account. Please try again.");
    return { deleted: true };
  });
