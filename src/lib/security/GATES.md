# Route Gate Registry

This file is the source of truth for which gates each API route applies. Update it whenever you add or remove a gate, and reference it in security review.

The gates:

- **AUTH** — caller is signed in. Implemented via `supabase.auth.getUser()` and a 401 on miss.
- **TOKEN** — caller holds a hashed bearer token (share, accountant, invite, unsubscribe). Token verification helpers live in `src/lib/security/*-by-token.ts`.
- **ADMIN** — caller is a platform admin. Implemented via `requirePlatformAdminForRoute()`.
- **CRON** — caller presents `CRON_SECRET` via `Authorization: Bearer …` and, on Vercel, the `vercel-cron` UA. Compared via `timingSafeEqual`.
- **BAA** — `checkBaaForPhi()` runs before any PHI write. For non-healthcare tenants this is a no-op; for healthcare tenants without an active `business_associate_agreements` row it returns 409. Required on every PHI write.
- **PAID** — `entitlementsFor(plan_tier)` gates the surface to paid tiers. Variants: `ai`, `accountantPortal`. Routes that need them return 402/403 on free/lite.
- **RATE** — `consumeRateLimit(key, max, window)` or the inline RPC. Constants live in `src/lib/security/rate-limits.ts`.
- **PHI-LOG** — writes a row to `phi_access_log` via `logPhiAccess()`. Required on every read/create/update/delete of a PHI-tagged column.

## Matrix

Legend: ✓ = gate applied · — = not applicable

| Route | Method | AUTH | TOKEN | ADMIN | CRON | BAA | PAID | RATE | PHI-LOG |
|---|---|---|---|---|---|---|---|---|---|
| `accountant/corrections` | POST | — | ✓ | — | — | — | — | ✓ | — |
| `accountant/invite` | POST | ✓ | — | — | — | — | — | ✓ | — |
| `accountant/note` | POST | — | ✓ | — | — | — | — | ✓ | — |
| `admin/accountant-connections/[id]/revoke` | DELETE | — | — | ✓ | — | — | — | — | — |
| `admin/businesses/[id]/plan-tier` | POST | — | — | ✓ | — | — | — | — | — |
| `admin/corrections/[id]/accept` | POST | — | — | ✓ | — | — | — | — | — |
| `admin/corrections/[id]/reject` | POST | — | — | ✓ | — | — | — | — | — |
| `admin/invites` | POST/DELETE | — | — | ✓ | — | — | — | — | — |
| `admin/rules/[id]/edit` | POST | — | — | ✓ | — | — | — | — | — |
| `admin/rules/[id]/verify` | POST | — | — | ✓ | — | — | — | — | — |
| `admin/share-tokens/[id]/revoke` | DELETE | — | — | ✓ | — | — | — | — | — |
| `admin/waitlist/[id]/invite` | POST | — | — | ✓ | — | — | — | — | — |
| `ai/compliance-insights` | GET | ✓ | — | — | — | — | ✓ | ✓ | — |
| `ai/share-with-accountant` | POST | ✓ | — | — | — | — | ✓ | ✓ | — |
| `audit-binders` | POST | ✓ | — | — | — | ✓ | — | — | ✓ |
| `audit-binders/[id]/lock` | POST | ✓ | — | — | — | — | — | — | ✓ |
| `baa/accept` | POST | ✓ | — | — | — | — | — | — | — |
| `billing/checkout` | POST | ✓ | — | — | — | — | — | ✓ | — |
| `billing/portal` | POST | ✓ | — | — | — | — | — | — | — |
| `billing/webhook` | POST | — | — | — | — | — | — | — | — |
| `coi/issues` | POST | ✓ | — | — | — | ✓ | — | — | ✓ |
| `coi/recipients` | POST/DELETE | ✓ | — | — | — | ✓ | — | — | ✓ |
| `cron/refresh-benchmarks` | GET | — | — | — | ✓ | — | — | — | — |
| `cron/reminders` | GET | — | — | — | ✓ | — | — | — | — |
| `documents/[id]/extract-expiry` | POST | ✓ | — | — | — | — | ✓ | ✓ | — |
| `documents/[id]/replace` | POST | ✓ | — | — | — | — | — | — | — |
| `export/pdf` | GET | ✓ | — | — | — | — | — | — | — |
| `filings` | POST | ✓ | — | — | — | ✓ | ✓ | — | — |
| `integrations/[provider]/callback` | GET | ✓ | — | — | — | — | ✓ | — | — |
| `integrations/[provider]/disconnect` | DELETE | ✓ | — | — | — | — | — | — | — |
| `integrations/[provider]/start` | GET | ✓ | — | — | — | — | ✓ | — | — |
| `integrations/[provider]/sync` | POST | ✓ | — | — | — | — | ✓ | ✓ | — |
| `locations` | POST | ✓ | — | — | — | — | — | — | — |
| `notifications/preferences` | POST | ✓ | — | — | — | — | — | — | — |
| `projects` | POST | ✓ | — | — | — | — | — | — | — |
| `projects/[id]/deadlines` | POST | ✓ | — | — | — | — | — | — | — |
| `share` | POST | ✓ | — | — | — | — | — | ✓ | — |
| `staff` | POST | ✓ | — | — | — | ✓ | — | — | — |
| `staff/credentials` | POST | ✓ | — | — | — | ✓ | — | — | ✓ |
| `staff/credentials/[id]/ce` | POST | ✓ | — | — | — | ✓ | — | — | ✓ |
| `team/invite` | POST | ✓ | — | — | — | — | — | — | — |
| `waitlist` | POST | — | — | — | — | — | — | ✓ | — |

## When adding a new route

1. Decide which gates apply. Use the same gate vocabulary as the matrix above.
2. Apply the gates in the order: AUTH/TOKEN/ADMIN → PAID → BAA → RATE → mutation → PHI-LOG. Each gate should short-circuit before doing work the next gate would block.
3. Add a row to this matrix in the same PR. Treat a missing row as a review-blocking omission.

## When changing a gate ceiling

The numeric values for RATE limits live in `src/lib/security/rate-limits.ts`. Don't inline new ceilings at the call site. The matrix above doesn't repeat the ceilings because they belong with the constants — the matrix records only *whether* a gate exists.

## Webhook exception

`billing/webhook` has no AUTH/TOKEN gate because it's verified via Stripe's signed payload — `stripe.webhooks.constructEvent` is the auth boundary. Don't add a getUser() check; it would always be null.
