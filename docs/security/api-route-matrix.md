# API route matrix

Externally reachable `src/app/**/route.ts` handlers. Middleware excludes `/api/*`; each route must enforce its own trust boundary.

| Path | Methods | Auth / trust | Data / tables | Supabase client |
|------|---------|----------------|---------------|-----------------|
| `api/waitlist/route.ts` | POST | Public (rate-limit at edge recommended) | `waitlist_signups` insert | Inline **service role** (RLS denies anon DML) |
| `api/billing/webhook/route.ts` | POST | Stripe `stripe-signature` | `businesses` billing fields | **Admin** |
| `api/cron/reminders/route.ts` | GET | `Authorization: Bearer` + on Vercel, `User-Agent` must include `vercel-cron` | `deadlines`, `businesses`, `reminder_log`, `compliance_score_history`, auth emails | **Admin** |
| `api/billing/checkout/route.ts` | POST | Session (`getUser`) | `businesses`, Stripe API | User (`createClient` / SSR) |
| `api/billing/portal/route.ts` | POST | Session | `businesses`, Stripe API | User |
| `api/ai/compliance-insights/route.ts` | POST | Session | `businesses`, `deadlines`, RPC `try_consume_ai_rate_limit` | User |
| `api/documents/[id]/extract-expiry/route.ts` | POST | Session + ownership | `documents`, storage signed URL | User + **Admin** (storage sign only) |
| `api/export/pdf/route.ts` | GET | Session | `businesses`, `deadlines` | User |
| `api/share/route.ts` | POST | Session | `share_tokens` | User |
| `api/accountant/invite/route.ts` | POST | Session | `accountant_connections` | User + **Admin** (insert/lookup; see allowlist) |

## Other server routes

| Path | Methods | Auth / trust | Notes |
|------|---------|----------------|-------|
| `(auth)/auth/callback/route.ts` | GET | OAuth `code` | `createServerClient` + anon key; `next` param sanitized against open redirect |

## Public pages (not `route.ts`)

| Path | Trust | Data access |
|------|-------|-------------|
| `share/[token]/page.tsx` | URL token | Server-only: `src/lib/security/share-by-token.ts` uses service role after token validation (no anon reads of tenant tables). |
| `accountant/[token]/page.tsx` | URL token | Server-only: `src/lib/security/accountant-by-token.ts` scopes all admin queries by `token`. |

When adding a new API route, update this table and `threat-models.md`.
