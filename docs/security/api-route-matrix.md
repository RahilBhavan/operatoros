# API route matrix

<!-- Last reviewed: 2026-05-15 — owner: rbhavanzim@gmail.com -->
<!-- Update trigger: any new file under `src/app/api/**/route.ts` or `src/app/(auth)/auth/callback/`. PR template enforces. -->

Externally reachable `src/app/**/route.ts` handlers. The proxy (`src/proxy.ts`) excludes `/api/*`; each route enforces its own trust boundary. The `share` and `accountant` token-based pages are listed at the bottom — they're public-by-URL, server-rendered.

## Public / unauthenticated

| Path | Methods | Auth / trust | Data / tables | Supabase client |
|------|---------|----------------|---------------|-----------------|
| `api/waitlist/route.ts` | POST | Public (Vercel WAF rate-limit gate at edge) | `waitlist_signups` insert (+ UTM + referral fields) | Inline **service role** (RLS denies anon DML) |
| `api/billing/webhook/route.ts` | POST | Stripe `stripe-signature` HMAC + customer-binding via `resolveTrustedBusinessId` | `businesses` billing fields | **Admin** |
| `api/cron/reminders/route.ts` | GET | `Authorization: Bearer ${CRON_SECRET}` + on Vercel, `User-Agent` contains `vercel-cron` | `deadlines`, `businesses`, `reminder_log`, `compliance_score_history`, `reminder_preferences`, auth emails | **Admin** |

## Session-gated (user JWT)

| Path | Methods | Auth / trust | Data / tables | Supabase client |
|------|---------|----------------|---------------|-----------------|
| `api/billing/checkout/route.ts` | POST | Session (`getUser`) | `businesses`, Stripe API | User (`createClient` / SSR) |
| `api/billing/portal/route.ts` | POST | Session | `businesses`, Stripe API | User |
| `api/ai/compliance-insights/route.ts` | POST | Session + `try_consume_ai_rate_limit` RPC + `ai_insight_cache` (6h context hash) | `businesses`, `deadlines`, `ai_rate_limits`, `ai_insight_cache` | User |
| `api/documents/[id]/extract-expiry/route.ts` | POST | Session + ownership join on `business.owner_id` | `documents`, storage signed URL | User → **Admin** for sign only |
| `api/documents/[id]/replace/route.ts` | POST | Session + ownership | `documents`, `document_versions` (archives prior), storage | User → **Admin** for sign only |
| `api/export/pdf/route.ts` | GET | Session | `businesses`, `deadlines` | User |
| `api/share/route.ts` | POST | Session + plan gating | `share_tokens` | User |
| `api/accountant/invite/route.ts` | POST | Session | `accountant_connections` (insert with random 32-byte token, 90-day expiry) | User + **Admin** (see allowlist) |
| `api/accountant/note/route.ts` | POST | Session | `accountant_deadline_notes` | User |
| `api/team/invite/route.ts` | POST | Session + `memberships` admin role | `memberships`, team invite token, `audit_events` | User |

## Platform admin (gated by `is_platform_admin()` RPC; non-admins get **404**, not 403)

| Path | Methods | Auth / trust | Data / tables | Supabase client |
|------|---------|----------------|---------------|-----------------|
| `api/admin/waitlist/[id]/invite/route.ts` | POST | `is_platform_admin()` | `waitlist_signups.invited_at`, `audit_events` (`platform.waitlist_invited`, `business_id` null) | **Admin** |
| `api/admin/businesses/[id]/plan-tier/route.ts` | POST | `is_platform_admin()` + required `reason` | `businesses.plan_tier`, `audit_events` | **Admin** |
| `api/admin/accountant-connections/[id]/revoke/route.ts` | POST | `is_platform_admin()` | `accountant_connections.revoked_at`, `audit_events` | **Admin** |
| `api/admin/share-tokens/[id]/revoke/route.ts` | POST | `is_platform_admin()` | `share_tokens.revoked_at`, `audit_events` | **Admin** |
| `api/admin/rules/[id]/verify/route.ts` | POST | `is_platform_admin()` | `regulatory_rules.last_verified_at`, `audit_events` (`platform.rule_verified`) | **Admin** |
| `api/admin/rules/[id]/edit/route.ts` | POST | `is_platform_admin()` + field-by-field validation | `regulatory_rules` via `version_regulatory_rule` RPC (forks v+1, sets `superseded_by`), `audit_events` (`platform.rule_versioned`) | **Admin** |
| `api/admin/invites/route.ts` | GET, POST | `is_platform_admin()` | `platform_admin_invites`, `audit_events` | **Admin** |

## Token-gated public pages (not `route.ts`)

| Path | Trust | Data access |
|------|-------|-------------|
| `share/[token]/page.tsx` | Opaque 32-byte hex token in URL + `expires_at` + revocation | Server-only: `src/lib/security/share-by-token.ts` uses service role after token validation. `record_share_view()` RPC writes `share_link_views`. No anon reads of tenant tables. |
| `accountant/[token]/page.tsx` | Opaque 32-byte hex token, 90-day expiry | Server-only: `src/lib/security/accountant-by-token.ts` scopes every query by `token`. Writes IP-hashed entries to `accountant_access_log`. |
| `(auth)/auth/callback/route.ts` | OAuth `code`; `next` param sanitized against open redirect (no `//`, no protocol) | `createServerClient` + anon key |
| `admin-accept/[token]/page.tsx` | One-time invite token, 7-day expiry | `claim_platform_admin_invite(token)` RPC with `FOR UPDATE` row lock |
| `invite/[token]/accept/page.tsx` | One-time team-invite token | `memberships` insert, invite consumed |
| `unsubscribe/[token]/page.tsx` | Opaque per-user token from `reminder_preferences.unsubscribe_token` | Sets `reminder_preferences.disabled` |

---

## Adding a new route — checklist

When you add a `route.ts` (or any of the token-gated server pages above):

1. Append a row to the right table here.
2. If it uses the **service role** (admin client), append a row to [`admin-client-allowlist.md`](./admin-client-allowlist.md) with the **why** and the **invariant** that prevents cross-tenant abuse.
3. If it touches new tables or new policies, update [`rls-matrix.md`](./rls-matrix.md).
4. Sketch a row in [`threat-models.md`](./threat-models.md) — assets / boundary / attacker / mitigations / residual risk.
5. The PR template asks you to confirm all four. CI does not enforce; reviewers do.
