# `createAdminClient` / service role allowlist

Service role **bypasses RLS**. Every callsite must document **why** the user-scoped client is insufficient and **what invariant** prevents cross-tenant abuse.

| Location | Why admin | Invariant / scope |
|----------|-----------|-------------------|
| `src/app/api/billing/webhook/route.ts` | Stripe has no user JWT; must update `businesses` after cryptographic event verification | Signature valid; business row matched by **`stripe_customer_id`** before applying metadata |
| `src/app/api/cron/reminders/route.ts` | Batch job across tenants; `auth.admin.getUserById` for emails | `Authorization: Bearer` + on Vercel, `User-Agent` contains `vercel-cron` |
| `src/app/api/documents/[id]/extract-expiry/route.ts` | Storage signed URL requires service role for private bucket | **After** `documents` row verified `owner_id = user` via user client |
| `src/app/api/accountant/invite/route.ts` | Insert into `accountant_connections` with server-generated token while keeping RLS simple | Authenticated owner resolved first; insert scoped to `business.id` from owner query |
| `src/app/api/waitlist/route.ts` | Public insert; RLS denies direct anon insert | Only `email` (+ timestamp) written; no broad reads |
| `src/lib/security/share-by-token.ts` | Read share view without user session | Queries filtered by **`token` + `expires_at`**; no list endpoints |
| `src/lib/security/accountant-by-token.ts` | Read accountant view without user session | Every query keyed by **`token`** from URL; portfolio limited to same `accountant_email` as connection |

If you add a new admin callsite, append a row here before merging.
