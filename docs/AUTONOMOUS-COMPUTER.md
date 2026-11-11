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

Activation attempt on 2026-11-11: conversation-only GitHub connection has `pull:true`, `push:false`, `admin:false` on the original repository. Actions settings and the Secrets public-key endpoints return 403; workflows list is empty. Access must be granted before writing the workflow/settings or storing its encrypted secret. No scheduler or website accounts were activated.

Reconnect was completed and re-tested: Secrets still returns 403. `/user` identifies the connected account as `elgizaiiio`, not original repository owner `elgiza2`. Do not loop reconnect or change app permissions to work around this. Obtain owner access or explicit approval for a separate private scheduler repository under the connected account.

The user approved a separate private repository. Created `elgizaiiio/ceyo-private-scheduler` (201), wrote `.github/workflows/agent-routines.yml` (201), verified repository Secrets public-key access (200), then deliberately disabled the workflow (204, readback `disabled_manually`). The published `web.ceyo.si` callback returns hosting HTTP 402 `DEPLOYMENT_DISABLED`; a preview unsigned callback returns 401, not evidence of a production deployment. Repository access is resolved. Activation still needs an approved live deployment, encrypted secret/URL configuration and successful callback/scheduled-run readback. Do not enable against a stopped site or advertise activation.

## Limitations
Recurring work consumes existing usage allowance and provider resources; free allowance can stop it well before a full day. No unlimited autonomous operation is promised. Websites can expire logins or require human verification; bots never bypass CAPTCHA/2FA or site rules. Instagram/WhatsApp/Shopify operations still require authorized accounts and successful website/API responses. Browser and media libraries install lazily and may fail due to provider/package availability; failures must remain visible. Large videos require compression or a larger separately reviewed delivery design.

## Verification
225 tests passed in the implementation pass. Live app-code checks read a produced text file, install ffmpeg, encode/read a 2,275-byte MP4 and observe a public page through Browserbase. A subsequent actual test-account UI sign-in and chat request ran code, exported computer-check.csv and downloaded exactly `name,total` then `check,42`. Reload readback, real website cookies and deployed schedules remain unverified. Source implementation is not evidence that external user accounts are connected or a scheduler is enabled.