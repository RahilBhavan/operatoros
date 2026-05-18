# Vercel deployment (OperatorOS)

## Project settings (Vercel dashboard)

In **Settings → General → Build & Development**, use:

| Setting | Value |
|---------|--------|
| Framework Preset | **Next.js** |
| Root Directory | `.` |
| Build Command | `npm run build` |
| Output Directory | *(leave empty)* |
| Install Command | `npm install` |
| Node.js Version | **20.x** |

Wrong framework or a custom output directory (e.g. `.next`) causes the browser to download files instead of rendering HTML.

## Environment variables

Copy [`.env.example`](../../.env.example) as the checklist. Set in **Production** and **Preview**:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_LITE_PRICE_ID`, `STRIPE_BUSINESS_PRICE_ID`, `STRIPE_ACCOUNTANT_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_APP_URL` — production custom domain (e.g. `https://operatoros.com`)
- `CRON_SECRET` — random secret; Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`

Pull from Vercel locally:

```bash
npm run env:pull
```

## Webhooks (external)

- **Stripe:** `https://<your-domain>/api/billing/webhook`
- **Supabase Auth (Google):** add production callback URL in Google Cloud Console

## Cron jobs (Hobby)

Defined in [`vercel.json`](../../vercel.json):

| Path | Schedule (UTC) |
|------|----------------|
| `/api/cron/reminders` | Daily 09:00 |
| `/api/cron/refresh-benchmarks` | Sunday 02:00 |

After deploy: **Settings → Cron Jobs** → run manually once and confirm **200** in function logs.

Hobby allows daily-or-less schedules only (both jobs qualify). Monitor reminder duration; `maxDuration` is 60s in code.

## Deploy commands

```bash
npm run deploy:preview   # preview URL
npm run deploy:prod      # production
```

Git push to `main` also deploys when the repo is connected in Vercel.

## Post-deploy smoke test

1. Open `/` in incognito — landing page HTML (not a download).
2. `/manifest.webmanifest` returns JSON.
3. Sign in → dashboard loads.
4. Cron manual run returns 200 (requires `CRON_SECRET`).
