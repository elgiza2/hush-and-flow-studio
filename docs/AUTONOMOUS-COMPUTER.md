# Autonomous computer — operating status

## Implemented
- Every authorized bot run has one isolated E2B computer; model code never executes in the app process.
- `browser` controls Browserbase via Playwright inside E2B. Database-claimed, server-only contexts are bound to bot AND owner. Cookies stay with Browserbase, not in chat or browser storage. Concurrent runs cannot overwrite a context.
- `browser action:login` returns a private temporary live browser handoff; the user completes login/2FA themselves. The agent stops, Browserbase persists the context on session end, and its lease expires after twelve minutes.
- `prepare_media` installs the imageio-ffmpeg binary inside E2B. The model edits authorized media through `run_code`, and `export_file` saves files up to 20 MB in private Storage before sandbox teardown.
- Chat downloads re-read owner-scoped artifact rows and private Storage; no permanent public download URL. Library includes produced files.
- Routines accept `interval_minutes:5`; legacy daily/weekly schedules remain unchanged. The existing database lease and unique run prevent overlapping/duplicate runs. Login-required routines pause. Saved goals bound account authorization; no blanket permission to buy, publish or create accounts.

## Scheduler activation (external Supabase)
There is no `cron.job` on this backend. User-managed Supabase cannot use Lovable's managed HTTP scheduler.
The committed GitHub Actions workflow invokes the existing protected callback every five minutes (288 checks/day). Actions can be delayed by GitHub; it is not an exact-time SLA. For strict timing use an external scheduler with a five-minute cadence and sufficient HTTP execution timeout.

An operator must configure the source repository variable `CEYO_APP_URL` to a deployed app origin and secret `CEYO_CRON_SECRET` to the same private value as the app's `LOVABLE_CRON_SECRET`. Never put its value in source. Enable scheduled workflows on the default branch. Only after a successful deployed callback and run readback set `CEYO_SCHEDULER_CONFIGURED=true` in the app server environment. Until then the agent must say the routine is saved, not running.

## Limitations
Recurring work consumes existing usage allowance and provider resources; free allowance can stop it well before a full day. No unlimited autonomous operation is promised. Websites can expire logins or require human verification; bots never bypass CAPTCHA/2FA or site rules. Instagram/WhatsApp/Shopify operations still require authorized accounts and successful website/API responses. Browser and media libraries install lazily and may fail due to provider/package availability; failures must remain visible. Large videos require compression or a larger separately reviewed delivery design.

## Verification
225 tests pass. Live app-code checks read a produced text file, install ffmpeg, encode/read a 2,275-byte MP4 and observe a public page through Browserbase. These do not verify signed-in chat/downloads, real website cookies or deployed schedules. Source implementation is not evidence that user accounts are connected or a scheduler is enabled.