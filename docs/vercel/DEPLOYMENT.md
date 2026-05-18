# Vercel deployment (OperatorOS)

## Critical: correct Vercel project and domain

The compliance app in this repo deploys from **GitHub `RahilBhavan/operatoros`** to the Vercel project **`rahilbhavans-projects/operatoros`**.

If `operatoros.vercel.app` shows a different product (“Let the agents handle it”, AI workforce marketing, `operatoros.ai`), that domain is attached to **another** Vercel project or an old deployment. The browser is not broken — the URL points at the wrong site.

### Fix in Vercel dashboard

1. Open [Vercel dashboard](https://vercel.com) → project linked to **this** GitHub repo (`operatoros` under `rahilbhavans-projects`).
2. **Settings → Domains**
   - Add `operatoros.vercel.app` (or your custom domain) to **this** project.
   - Remove that domain from any other project that currently owns it.
3. **Settings → Deployment Protection**
   - Set **Production** to **Off** (or “Only preview deployments”) so visitors are not forced through Vercel SSO.
   - Preview URLs like `operatoros-<hash>-rahilbhavans-projects.vercel.app` otherwise return 401 and can look like a broken download.
4. **Settings → Git** — confirm repository `RahilBhavan/operatoros`, production branch `main`.

### Verify you hit the right deployment

After deploy, open (incognito):

```text
https://<your-production-domain>/api/health
```

Expected JSON:

```json
{ "ok": true, "app": "operatoros-compliance", "version": "c3ddc89" }
```

Landing page should mention **compliance deadlines**, waitlist / sign-in — not “AI agents” or “Voice Agent”.

View page source on `/` and confirm `<html … data-app="operatoros-compliance">`.

### PWA / service worker

`NEXT_PUBLIC_ENABLE_PWA` defaults to **off**. Set it to `true` in Vercel env only after `/api/health` and the homepage look correct — a stale service worker from an old deploy can make navigation feel like a broken download.

---

## Project settings (Build & Development)

| Setting | Value |
|---------|--------|
| Framework Preset | **Next.js** |
| Root Directory | `.` |
| Build Command | `npm run build` |
| Output Directory | **(empty — do not set `.next` or `out`)** |
| Install Command | `npm install` |
| Node.js Version | **20.x** |

**Wrong Output Directory** (e.g. `.next`) is the usual cause of “the link downloads bytes instead of showing the website”: Vercel serves build artifacts as raw files instead of running the Next.js router.

`vercel.json` in this repo sets `framework`, `buildCommand`, and `installCommand` but intentionally does **not** set `outputDirectory`.

---

## Environment variables

### Error: “URL and Key are required to create a Supabase client”

Vercel is missing Supabase env vars (or they were added without a **redeploy**). In the project linked to this repo:

1. [Supabase → Project Settings → API](https://supabase.com/dashboard/project/_/settings/api) — copy **Project URL** and **anon public** key.
2. Vercel → **Settings → Environment Variables** — add for **Production** and **Preview**:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (server-only; never expose to the browser)
3. **Redeploy** (required — env changes do not apply until you redeploy; `NEXT_PUBLIC_*` vars are also inlined at build time).

Check: `GET /api/health` should return `"supabase": { "public": true, "serviceRole": true }`.

Until env is set, `/` should still load (yellow setup banner). If you still see the generic Supabase error, the deployment is on an **older commit** — open the latest deployment in Vercel and confirm it includes commit `fix(supabase): allow missing env on marketing routes` or newer.

Aliases accepted: `SUPABASE_URL` / `SUPABASE_ANON_KEY` (in addition to the `NEXT_PUBLIC_*` names).

Optional: link the [Supabase Vercel integration](https://vercel.com/integrations/supabase) to auto-inject these variables.

---

Copy [`.env.example`](../../.env.example). Set in **Production** and **Preview**:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_LITE_PRICE_ID`, `STRIPE_BUSINESS_PRICE_ID`, `STRIPE_ACCOUNTANT_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_APP_URL` — must match the live hostname (e.g. `https://www.operatoros.app`). Preview can omit it; code falls back to `VERCEL_URL`.
- `CRON_SECRET` — required for cron routes

```bash
npm run env:pull
```

### External webhooks

- **Stripe:** `https://<your-domain>/api/billing/webhook`
- **Supabase Auth (Google):** production callback URL in Google Cloud Console

### Domains not on this project

| Domain | Status |
|--------|--------|
| `operatoros.com` | Parking / redirect — **not** this app. Point DNS to Vercel only after connecting the domain to this project. |
| `operatoros.vercel.app` | May belong to a **different** project until you reassign it (see above). |

---

## Cron jobs (Hobby)

| Path | Schedule (UTC) |
|------|----------------|
| `/api/cron/reminders` | Daily 09:00 |
| `/api/cron/refresh-benchmarks` | Sunday 02:00 |

Requires `CRON_SECRET`. After deploy: **Cron Jobs** → run once → check logs for **200**.

---

## Deploy commands

```bash
npm run deploy:preview
npm run deploy:prod
```

Git push to `main` deploys when the repo is connected.

---

## Post-deploy smoke test

1. `/api/health` → `operatoros-compliance`
2. `/` → compliance marketing page (HTML, not a file download)
3. `/manifest.webmanifest` → JSON
4. `/sw.js` → JavaScript (`Content-Type: application/javascript`)
5. Sign-in → dashboard
6. Cron manual run → 200 in logs

If the homepage still downloads a file after a green build, re-check **Output Directory** (must be empty) and **Domains** (must point at this repo’s project).
