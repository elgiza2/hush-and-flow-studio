/** @doc Bridge to the Ceyo Android app (WebView JavascriptInterface `MegsyAndroid`).
 *  Real alarms/reminders are scheduled on the phone; the push token is stored per user.
 *  See docs/android-bridge.md for the native side. No-ops in a normal browser. */
import { supabase } from "@/integrations/supabase/legacyClient";

type NativeApi = {
  scheduleAlarm?: (json: string) => void;
  scheduleReminder?: (json: string) => void;
  cancel?: (id: string) => void;
  requestPushToken?: () => void;
};

declare global {
  interface Window {
    MegsyAndroid?: NativeApi;
    megsyNativePushToken?: (token: string) => void;
  }
}

export type NativeTask = { id: string; title: string; kind: string | null; remind_at: string | null; status?: string | null };

function api(): NativeApi | null {
  return typeof window !== "undefined" && window.MegsyAndroid ? window.MegsyAndroid : null;
}

export const isNativeApp = () => !!api();

/** Schedule (or reschedule) a task on the phone. Done/past/timeless tasks get cancelled. */
export function syncNativeTask(t: NativeTask): void {
  const a = api();
  if (!a) return;
  try {
    const at = t.remind_at ? new Date(t.remind_at).getTime() : 0;
    if (!at || at < Date.now() || t.status === "done") {
      a.cancel?.(t.id);
      return;
    }
    const payload = JSON.stringify({ id: t.id, title: t.title, at, path: "/tasks" });
    if (t.kind === "alarm") a.scheduleAlarm?.(payload);
    else a.scheduleReminder?.(payload);
  } catch {
    /* ignore bridge errors */
  }
}

export function cancelNativeTask(id: string): void {
  try {
    api()?.cancel?.(id);
  } catch {
    /* ignore */
  }
}

/** Closed-test native build: do not query retired task/push tables. */
export async function bootNativeBridge(): Promise<void> {
  // Native alarms remain available through explicit syncNativeTask calls.
  // Background push is unavailable until an authorized transport is configured.
  if (!api()) return;
}
