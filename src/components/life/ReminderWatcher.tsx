/** Native notification bridge. Current reminders are delivered through agent_calls. */
import { useEffect } from "react";
import { bootNativeBridge } from "@/lib/native/bridge";
export default function ReminderWatcher() {
  useEffect(() => { void bootNativeBridge(); }, []);
  return null;
}
