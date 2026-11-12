/** Retired reminder API: current scheduled work uses the verified ceyo-routines endpoint. */
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/reminders-tick")({
  server: { handlers: { POST: async () => Response.json({ error: "This reminder service has been retired." }, { status: 410, headers: { "Cache-Control": "no-store" } }) } },
});
