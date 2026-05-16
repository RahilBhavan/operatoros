# Architecture

<!-- Last reviewed: 2026-05-16 — owner: rbhavanzim@gmail.com -->
<!-- Update trigger: change to src/proxy.ts · new Supabase client wrapper · change to the regulatory-graph runtime path · new cron · new token-gated surface -->

How the code actually fits together. The pitch is in `OVERVIEW.md`; this is the engineering view — request flows, trust boundaries, the regulatory-graph runtime, and the three Supabase client types.

---

## 1. The shape

```
       ┌──────────────────────┐
       │  Browser / OAuth      │
       └────────┬─────────────┘
                │  HTTPS (cookies / bearer / Stripe sig)
                ▼
       ┌─────────────────────────────────────────┐
       │  Next.js 16 App Router on Vercel        │
       │  src/proxy.ts (matcher excludes /api)   │  ← session-aware redirect
       │  src/app/(app|auth|onboarding|...)      │  ← server components
       │  src/app/api/**/route.ts                │  ← per-route trust boundary
       │  src/app/admin/**                       │  ← gated by is_platform_admin()
       │  src/app/share|accountant|invite/**     │  ← opaque-token surfaces
       └────────┬───────────────────┬────────────┘
                │ user JWT          │ service role (audited callsites)
                ▼                   ▼
       ┌─────────────────────────────────────────┐
       │  Supabase (Postgres · Auth · Storage)   │
       │  RLS on every tenant table              │
       │  RPCs as SECURITY DEFINER for atomic     │
       │  ops (auth rate limit, onboarding,       │
       │  rule versioning, admin check)           │
       └────────┬───────────────────┬────────────┘
                │                   │
        ┌───────▼─────┐   ┌─────────▼─────┐   ┌──────────────┐
        │ Stripe API   │   │ Anthropic API │   │ Resend API   │
        │ + webhook    │   │ (Claude)      │   │ (email cron) │
        └──────────────┘   └───────────────┘   └──────────────┘
```

Vercel runs the daily reminder cron (09:00 UTC) via `vercel.json` → `GET /api/cron/reminders`, bearer-authenticated.

---

## 2. Routing & the proxy

`src/proxy.ts` is Next 16's `proxy` middleware (renamed from `middleware`). Its job is **session-aware redirects only**:

- `/dashboard`, `/deadlines`, `/billing`, `/onboarding`, `/settings` → require an auth user, else redirect to `/sign-in`.
- `/sign-in`, `/sign-up` → if already authenticated, redirect to `/dashboard`.
- Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, `api`, `share`. **API routes enforce their own trust boundaries** — the proxy never gates them.

Three classes of route enforce their boundary differently:

| Class | Where | How it gates |
|-------|-------|--------------|
| Public/anonymous | `api/waitlist`, `api/billing/webhook`, `api/cron/reminders` | Inline service role + Stripe sig / bearer / WAF |
| Session-gated | `api/billing/*`, `api/ai/*`, `api/documents/*`, `api/export/*`, `api/share`, `api/accountant/*`, `api/team/*` | `supabase.auth.getUser()` + RLS on user client |
| Platform-admin | `api/admin/**` and `/admin/**` pages | `is_platform_admin()` RPC; non-admins get **404** (not 403) so the surface isn't probeable |

Full table: [`security/api-route-matrix.md`](./security/api-route-matrix.md).

---

## 3. The three Supabase clients

| Client | Where | Role | When to use |
|--------|-------|------|-------------|
| **Anon SSR** | `src/lib/supabase/server.ts` (the SSR client) + `src/proxy.ts` | `anon` | Only to resolve session via cookies; never to read tenant data |
| **User** | `src/lib/supabase/server.ts` (`createClient`) | `authenticated` | Default for any session-gated route or server component reading tenant data. RLS does the work. |
| **Admin** | `src/lib/supabase/admin.ts` (`createAdminClient`) | `service_role` (bypasses RLS) | Only when the user client cannot — cron, Stripe webhook, storage signed URLs after ownership check, RPCs that need elevated visibility |

**Rule:** every admin callsite has a row in [`security/admin-client-allowlist.md`](./security/admin-client-allowlist.md) with the *why* and the *invariant* that prevents cross-tenant abuse. Adding a callsite without updating that doc is a review-blocker.

---

## 4. The regulatory rule graph (the moat substrate)

This is the most distinctive piece of the architecture. Today most of the SMB compliance market hardcodes deadlines. OperatorOS doesn't.

```
            ┌──────────────────────────────────────────┐
            │  regulatory_rules (Postgres, versioned)   │
            │  91 seeded rows · federal + 5 states +    │
            │  templated state-fallback-* rules         │
            └────────────┬─────────────────────────────┘
                         │ SELECT (RLS-open authenticated read)
                         ▼
            ┌──────────────────────────────────────────┐
            │  loadActiveRules() in regulatory-graph.ts │
            │  · Zod-validates every row                │
            │  · in-process cache, 10 min TTL           │
            │  · falls back to LEGACY_RULES on error    │
            │    or empty table (cold-start safety)     │
            └────────────┬─────────────────────────────┘
                         │ RuleDef[]
                         ▼
            ┌──────────────────────────────────────────┐
            │  buildStarterDeadlines(rules, data, …)    │
            │  (pure; evaluates AppliesWhen + DueDate)  │
            └────────────┬─────────────────────────────┘
                         │ Deadline[]
                         ▼
            ┌──────────────────────────────────────────┐
            │  complete_onboarding RPC                  │
            │  · transactional 3-write                  │
            │    (business + location + deadlines)      │
            │  · stamps rule_id / version /             │
            │    occurrence_key for dedup               │
            └──────────────────────────────────────────┘
```

Key files: `src/lib/regulatory-graph.ts` (~1.6k LOC), `src/lib/seed-deadlines.ts` (70-LOC wrapper preserving the legacy signature), `src/app/(onboarding)/onboarding/actions.ts`. Schema: migrations `20260516000004_regulatory_rules.sql` (table + RLS + indices), `_005` (seed), `_006` (versioning RPC).

**Admin loop:**
- `/admin/rules` — list with jurisdiction/verification filters, 50-state coverage gaps, missing-states banner, superseded rows hidden.
- `/admin/rules/[id]` — detail with Verify (stamps `last_verified_at` + writes `audit_events`) and Edit (calls `version_regulatory_rule` RPC → forks v+1, sets `superseded_by`).

**Known surfaced tradeoff (called out at `regulatory-graph.ts:13-17`):** new-business seeding still uses the in-memory `LEGACY_RULES` mirror; admin edits flow into the DB but don't reach the seeder until Workstream B's confidence-tier switch lands. Deliberate, documented.

---

## 5. Tenant data plane

Tenancy is rooted at `businesses.owner_id = auth.uid()`. Every tenant table joins back to a business. RLS does all of it — no app-layer ownership checks (with one exception: `documents/[id]/extract-expiry` does an explicit ownership join before minting a signed URL, because the storage signing step needs the admin client).

Team access: `memberships` lets additional users access a business (with admin/member roles). RLS reads `auth.uid()` against `memberships.user_id` to grant non-owner access.

Cross-tenant staff: `platform_admins` is checked by `is_platform_admin()` RPC; `/admin/**` routes return 404 (not 403) for non-admins so the surface is not probeable.

Full table-by-table: [`security/rls-matrix.md`](./security/rls-matrix.md).

---

## 6. Token-gated public surfaces

Two patterns sit alongside session-auth:

| Surface | Token | Loader | Why this exists |
|---------|-------|--------|-----------------|
| `share/[token]` | 32-byte hex, configurable expiry, revocable | `src/lib/security/share-by-token.ts` (admin client after token validation) | Auditor / insurer / GC viewing a one-business snapshot without account |
| `accountant/[token]` | 32-byte hex, 90-day expiry | `src/lib/security/accountant-by-token.ts` (queries scoped by token; portfolio limited to same `accountant_email`) | Accountant reaches every client portfolio via magic link, no per-tenant login |
| `invite/[token]/accept` | One-time team-invite token | `memberships` insert | Team member invited by business admin |
| `admin-accept/[token]` | One-time, 7-day expiry | `claim_platform_admin_invite` RPC with `FOR UPDATE` lock | Bootstrap a second platform admin without exposing the seed flow |
| `unsubscribe/[token]` | Per-user unsubscribe token | `reminder_preferences` update | Email-cron unsub link |

All token loaders use the admin client *after* validating the token — the URL is the cap.

---

## 7. The cron

Single Vercel cron, daily 09:00 UTC, defined in `vercel.json` → `GET /api/cron/reminders`:

1. Auth: `Authorization: Bearer ${CRON_SECRET}` + on Vercel, `User-Agent` must contain `vercel-cron`.
2. Reads `deadlines` × `reminder_preferences` × `businesses` cross-tenant via admin client.
3. Sends multi-stage emails (T-30 / T-7 / T-1 / overdue) through Resend with severity color + statute citation + penalty $ in subject.
4. Writes `reminder_log` and a snapshot of each business's compliance score to `compliance_score_history`.
5. Channels are fan-out-ready: `reminder_preferences` has `sms_enabled` / `slack_enabled` columns; wire-up is Workstream G (deferred).

---

## 8. Billing flow

```
  /billing
    └── POST /api/billing/checkout  (user, session) → Stripe Checkout
            ↓ subscription.created
        Stripe webhook → POST /api/billing/webhook
            · verifies stripe-signature
            · resolveTrustedBusinessId binds session.customer → businesses.stripe_customer_id
            · admin client updates businesses.plan_tier / stripe_subscription_id / ...
            · writes audit_events
```

Notes:
- `businesses.stripe_customer_id` is the trust anchor; webhook metadata is only accepted when it matches.
- Admin MRR on `/admin` is computed `plan_tier × count` today and labeled "not Stripe-source-of-truth." Workstream F mirrors Stripe subs into `stripe_subscriptions` to fix the gap.

---

## 9. AI insight path

`POST /api/ai/compliance-insights`:

1. Session check via user client.
2. `try_consume_ai_rate_limit(business_id, max, window)` RPC — atomic with an advisory tx lock to prevent parallel-request quota burst.
3. Hash the relevant business context (profile + active deadlines), check `ai_insight_cache` (6-hour TTL).
4. On miss, call Anthropic with industry-specialized prompt, structured-output parse, write to cache, return.
5. Every insight grounded against tracked deadlines, sourced to agency, marked "review required."

Cost ceiling: ~$2/customer/mo via the cache + rate limit (per `OVERVIEW.md` §9 cost line).

---

## 10. Auth & rate limiting

- Email + password (Supabase Auth) and Google OAuth (`(auth)/auth/callback`).
- The callback sanitizes the `next` param against open redirect (rejects `//` and protocols).
- `try_consume_auth_rate_limit(action, ip, email)` gates both sign-in and sign-up at 5 attempts per 15-min window per `(ip, email)`.

---

## 11. CI / verification

- `.github/workflows/security.yml` — Semgrep (TS/JS/SQL) + `bun audit`.
- `.github/workflows/codeql.yml` — CodeQL on push/PR.
- Local pre-merge: `bun run type-check && bun run test && bun run lint && bun run build`.
- After schema changes: `bun run security:db-lint` (Supabase) + Dashboard Security Advisor.

Pre-merge bar (from `docs/roadmap/WORLD_CLASS.md` §0): `tsc --noEmit` clean · vitest 100% pass · `next build` succeeds · `eslint` 0 errors · 1 manual e2e walkthrough documented in the PR.

---

## 12. What is *not* here

- No service-mesh / multi-region / read replicas — single Supabase Postgres + Vercel edge.
- No queue — the daily cron is the only async path. Future SMS/Slack fan-out (Workstream G) and the regulatory-corrections accept flow (Workstream B) will introduce Edge Functions or direct RPC calls; no broker yet.
- No mobile app — responsive web only.
- No public API for partners — Stripe webhook is the only inbound integration; `bun run db:types` regenerates typed clients for internal consumption.

If you need any of these, write it up here before adding it.
