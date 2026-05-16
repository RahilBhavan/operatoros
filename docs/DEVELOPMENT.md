# Development

<!-- Last reviewed: 2026-05-16 — owner: rbhavanzim@gmail.com -->
<!-- Update trigger: change to package.json scripts · new test type · new local-stack step · CI workflow change -->

Local setup, scripts, testing, debugging. The product-level intro lives in `README.md`; this is the engineering-level companion.

---

## 1. Prerequisites

- **Node.js 20+** (only required by some tools; runtime is Bun-managed)
- **Bun** ≥ 1.x — the package manager and lockfile of record. CI uses `oven-sh/setup-bun@v2`.
- **Supabase project** — local or hosted. Local stack via `supabase start` (requires Docker).
- **Stripe** test-mode account
- **Resend** account
- **Anthropic API key**
- Optional: `semgrep` CLI for local SAST, `playwright` browsers (`bunx playwright install`) for e2e.

---

## 2. First-time setup

```bash
bun install
cp .env.example .env.local
# fill in the values — see §3
bun run db:push          # apply migrations to your Supabase project
bun run db:types         # regenerate src/types/supabase.ts
bun run dev              # http://localhost:3000
```

Stripe webhook locally: `stripe listen --forward-to localhost:3000/api/billing/webhook`. Use the `whsec_...` it prints as `STRIPE_WEBHOOK_SECRET`.

For the cron route, hit it locally with the bearer:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
     -H "User-Agent: vercel-cron" \
     http://localhost:3000/api/cron/reminders
```

---

## 3. Environment variables

The full set is in `.env.example`. By category:

| Group | Vars | Used in |
|-------|------|---------|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | All Supabase clients (`src/lib/supabase/*`) |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_BUSINESS_PRICE_ID`, `STRIPE_ACCOUNTANT_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | `src/lib/stripe.ts`, `src/app/api/billing/**` |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` | `src/lib/email.ts`, cron + invites |
| AI | `ANTHROPIC_API_KEY` | `src/app/api/ai/compliance-insights/route.ts`, `src/app/api/documents/[id]/extract-expiry/route.ts` |
| App | `NEXT_PUBLIC_APP_URL` | Public links (share, accountant magic links, unsubscribe) |
| Cron | `CRON_SECRET` | `src/app/api/cron/reminders/route.ts` bearer auth |

Google OAuth is configured in **Supabase Dashboard → Auth → Providers → Google** (not via env). Add the Supabase callback URL to Google Cloud Console authorized redirect URIs.

---

## 4. Scripts

```
bun run dev                # next dev (port 3000)
bun run build              # production build
bun run start              # serve built app

bun run lint               # eslint over src/
bun run type-check         # tsc --noEmit
bun run test               # vitest run (unit + component)
bun run test:e2e           # playwright

bun run security:deps      # bun audit
bun run security:sast      # semgrep with TS/JS/SQL rulesets
bun run security:db-lint   # supabase db lint

bun run db:push            # apply migrations
bun run db:types           # regen src/types/supabase.ts
```

**Pre-merge bar** (from `docs/roadmap/WORLD_CLASS.md` §0): `tsc --noEmit` clean · `vitest run` 100% pass · `next build` succeeds · `eslint` 0 errors · 1 manual e2e walkthrough documented in the PR.

---

## 5. Testing

### Unit + component (Vitest)
- Lives in `src/__tests__/{lib,components,e2e}/`.
- `setup.ts` wires `@testing-library/jest-dom` and JSDOM.
- Pure functions in `src/lib/` should have a co-located spec under `src/__tests__/lib/`.

### Snapshot + drift guards
Three load-bearing specs to keep the regulatory graph honest — do not delete or relax without flagging:
- `regulatory-graph-evaluator.test.ts` — per-`due_date_rule.kind` evaluator, including the `quarterly_941` "Jan 31 dropped mid-year" quirk pinned by explicit assertion.
- `regulatory-graph-seed.test.ts` — drift guard between `LEGACY_RULES` in TS and the seed migration. Regenerate with `WRITE_SEED=1 bun run test ...`.
- `seed-deadlines-snapshot.test.ts` — snapshot equivalence between the new graph engine and the old hardcoded builder across 6 representative `(state, industry, entity, employee)` combos.

### Playwright (e2e)
`bun run test:e2e` — config in `playwright.config.ts`. Specs in `src/__tests__/e2e/`. Used for full flows (signup → onboarding → first reminder).

---

## 6. Debugging tips

- **RLS confusion:** when a query unexpectedly returns empty, double-check whether the route uses the user client (RLS applied) or the admin client (RLS bypassed). The matrix is in [`security/admin-client-allowlist.md`](./security/admin-client-allowlist.md).
- **Why does `/admin/...` 404 for me?** You're not in `platform_admins`. Insert yourself via the Supabase dashboard or use the invite flow from another admin.
- **Stripe webhook locally:** if the signature check fails, you're almost certainly using the live webhook secret instead of the one `stripe listen` printed for this terminal session.
- **Regulatory rules cache:** `loadActiveRules()` caches for 10 minutes in process. To force a refresh in dev, restart `bun run dev` or wait the TTL. Admin edits land in the DB immediately, but new-business seeding still reads `LEGACY_RULES` — this is the deliberate tradeoff called out at `src/lib/regulatory-graph.ts:13-17` (closes when Workstream B's confidence switch lands).
- **Local Supabase types out of date:** `bun run db:types` after every migration. CI does not regenerate.

---

## 7. Adding things

- **A new migration** → see [`DATABASE.md`](./DATABASE.md) §4.
- **A new API route** → see [`security/api-route-matrix.md`](./security/api-route-matrix.md) "Adding a new route — checklist".
- **A new regulatory rule** → edit `LEGACY_RULES` in `src/lib/regulatory-graph.ts`, then `WRITE_SEED=1 bun run test src/__tests__/lib/regulatory-graph-seed.test.ts` to regenerate the seed migration. Run the snapshot test to confirm onboarding still produces equivalent output for the existing test combos.
- **A new doc** → add it under the right group in [`docs/INDEX.md`](./INDEX.md) and append a row to [`docs/MAINTENANCE.md`](./MAINTENANCE.md) with owner + trigger.

---

## 8. Repo layout (top level)

```
src/
├── app/
│   ├── (app)/          authenticated app (dashboard, deadlines, billing, settings)
│   ├── (auth)/         sign-in / sign-up / OAuth callback
│   ├── (onboarding)/   first-run; calls complete_onboarding RPC
│   ├── accountant/     magic-link accountant portal
│   ├── admin/          platform-admin pages, gated by is_platform_admin()
│   ├── admin-accept/   one-time platform-admin invite landing
│   ├── api/            HTTP routes — auth/trust enforced per-route
│   ├── invite/         team-invite accept
│   ├── share/[token]/  public read-only audit views
│   └── unsubscribe/    per-user reminder unsubscribe
├── components/
│   ├── admin/          admin UI
│   ├── dashboard/      compliance score, top-3 actions, AI insights
│   ├── doctrine/       The Tag Doctrine primitives (see DESIGN_PHILOSOPHY.md)
│   └── marketing/      landing-page sections
├── lib/
│   ├── admin/          admin-only helpers
│   ├── email-templates/ Resend templates
│   ├── security/       token loaders (share, accountant) — RLS-bypass-after-token-validation
│   ├── supabase/       client/server/admin Supabase factories
│   ├── deadline-utils.ts  scoring algorithm + status helpers
│   ├── email.ts        Resend wrappers
│   ├── onboarding-utils.ts
│   ├── regulatory-graph.ts  rule types + LEGACY_RULES + loadActiveRules + evaluator
│   ├── seed-deadlines.ts    thin 70-LOC delegating wrapper (legacy signature)
│   └── stripe.ts       PLAN catalog + price-id resolution + customer binding
├── types/
└── proxy.ts            Next 16 proxy (session-aware redirects only)

supabase/migrations/    27 migrations, ordered by filename
docs/                   architecture, database, dev, security/, roadmap/, vc-review/, INDEX, MAINTENANCE
.github/workflows/      security.yml (semgrep + bun audit) · codeql.yml
```
