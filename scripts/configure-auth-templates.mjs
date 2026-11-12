// Operator-only. Never import into the app or print management responses.
import { readFile } from "node:fs/promises";
const token = process.env.CEYO_SUPABASE_MANAGEMENT_TOKEN;
if (!token) { console.error("Email template activation needs the configured management credential."); process.exitCode = 1; }
else {
  try {
    const content = await readFile(new URL("../public/email/auth-template.html", import.meta.url), "utf8");
    const config = Object.fromEntries(["confirmation", "magic_link", "recovery", "email_change", "reauthentication", "invite"].map(k => [`mailer_templates_${k}_content`, content]));
    const url = "https://api.supabase.com/v1/projects/kcrssdgsefhpzoidlhhm/config/auth";
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const response = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(config) });
    if (!response.ok) throw new Error();
    const current = await fetch(url, { headers });
    if (!current.ok) throw new Error();
    const result = await current.json();
    if (!Object.entries(config).every(([k,v]) => result[k] === v)) throw new Error();
    console.log("Ceyo authentication templates saved and read back. Inbox delivery remains unverified.");
  } catch { console.error("Email template activation could not be verified. No credentials were logged."); process.exitCode = 1; }
}
