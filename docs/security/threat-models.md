# Lightweight threat models (per route / surface)

## Conventions

- **Assets:** user data, billing state, tokens, PII.
- **Trust boundary:** browser, Stripe, Vercel cron, bearer secrets.
- **Residual risk:** documented explicitly.

---

### `POST /api/waitlist`

- **Assets:** emails in `waitlist_signups`.
- **Boundary:** public internet → Next route → Supabase service role.
- **Attacker:** spam signups, DB fill.
- **Mitigations:** validate email shape; service role never exposed to client. **Before public launch: enable Vercel WAF rate-limit rule on `/api/waitlist`** (e.g. 10 req/min/IP); add CAPTCHA if abuse appears.
- **Residual:** no proof of human; email enumeration via timing (low).

### `POST /api/billing/webhook`

- **Assets:** subscription state on `businesses`.
- **Boundary:** Stripe → HMAC signature → admin client.
- **Attacker:** forged events without secret; metadata spoof if signature valid on wrong session.
- **Mitigations:** verify signature; resolve business by `stripe_customer_id` = session.customer; require metadata `business_id` match DB row before update.
- **Residual:** Stripe account compromise.

### `GET /api/cron/reminders`

- **Assets:** all businesses’ deadlines, emails via auth admin.
- **Boundary:** Bearer secret; on Vercel, requests must include `vercel-cron` in the `User-Agent` (per Vercel cron docs).
- **Attacker:** secret leak → mass read/send.
- **Mitigations:** rotate `CRON_SECRET`; never log Authorization; admin only in this route.
- **Residual:** insider with secret.

### `POST /api/billing/checkout` / `POST /api/billing/portal`

- **Assets:** Stripe session URLs, `stripe_customer_id`.
- **Boundary:** user session → user-scoped Supabase (RLS).
- **Attacker:** session hijack.
- **Mitigations:** Supabase session cookies; RLS on `businesses`.
- **Residual:** XSS stealing session (mitigate with CSP where possible).

### `POST /api/ai/compliance-insights`

- **Assets:** business context sent to Anthropic; cost abuse.
- **Boundary:** session → RLS reads; atomic `try_consume_ai_rate_limit` RPC.
- **Attacker:** parallel requests to exceed quota.
- **Mitigations:** RPC with advisory transaction lock; constant max/window.
- **Residual:** model prompt injection (content risk).

### `POST /api/documents/[id]/extract-expiry`

- **Assets:** file bytes to LLM; document metadata.
- **Boundary:** session; ownership join business `owner_id`.
- **Attacker:** IDOR on `id` without ownership.
- **Mitigations:** ownership check before admin signed URL; short-lived signed URL.
- **Residual:** LLM data handling policies.

### `GET /api/export/pdf`

- **Assets:** deadline report HTML.
- **Boundary:** session + RLS.
- **Attacker:** same as session routes.
- **Mitigations:** `escapeHtml` on dynamic fields; session required.

### `POST /api/share`

- **Assets:** new share token.
- **Boundary:** session; plan gating in route.
- **Attacker:** authenticated user on wrong plan (403).
- **Mitigations:** RLS on `share_tokens` for authenticated owner.

### `POST /api/accountant/invite`

- **Assets:** accountant email, magic link token.
- **Boundary:** session + admin for insert (see admin allowlist).
- **Attacker:** owner invites arbitrary email (intended); token guess (128-bit hex).
- **Mitigations:** random token default; HTTPS.

### `GET /share/[token]`

- **Assets:** read-only compliance snapshot for one business.
- **Boundary:** opaque token in URL; server-only DB access.
- **Attacker:** token leak/guess.
- **Mitigations:** 32-byte random hex; expiry; no anon bulk policies.
- **Residual:** link forwarded intentionally.

### `GET /accountant/[token]`

- **Assets:** business + deadlines + portfolio list for same accountant email.
- **Boundary:** opaque token; server module scopes queries by token.
- **Attacker:** token guess.
- **Mitigations:** 32-byte random hex; optional future rate limit on lookups.
- **Residual:** shared link forwarding.

### `GET /auth/callback`

- **Assets:** session establishment.
- **Boundary:** OAuth code; `next` param.
- **Attacker:** open redirect.
- **Mitigations:** relative path only; reject `//`.
- **Residual:** OAuth provider compromise.
