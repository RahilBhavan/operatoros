# RLS and role matrix

<!-- Last reviewed: 2026-05-15 — owner: rbhavanzim@gmail.com -->
<!-- Update trigger: any new `create table` or `create policy` in `supabase/migrations/**`. PR template enforces. -->

Supabase roles: **anon** (public anon key), **authenticated** (user JWT), **service_role** (admin key; server-only). Tenant scope is owned via `businesses.owner_id = auth.uid()`; cross-tenant staff scope is owned via the `is_platform_admin()` RPC.

## Tenant tables

| Table | RLS | anon | authenticated | service_role / notes |
|-------|-----|------|-----------------|----------------------|
| `businesses` | on | denied (anon share policies removed; use server token loader) | Owner `owner_id = auth.uid()` all | Cron, webhooks, token loaders, admin |
| `locations` | on | — | Owner via business | — |
| `deadlines` | on | denied (anon read removed) | Owner via business | Cron, token loaders. `rule_id` links to `regulatory_rules`. |
| `documents` | on | — | Owner via business | — |
| `document_versions` | on | — | Owner via parent document | Replace endpoint inserts archived versions |
| `audit_log` | on | — | Owner SELECT | Server-only inserts |
| `share_tokens` | on | denied | Owner manage | Token validation server-side; revocation writes `audit_events` |
| `share_link_views` | on | — | Owner SELECT (analytics on their own links) | `record_share_view()` RPC SECURITY DEFINER inserts |
| `accountant_connections` | on | — | Owner ALL | Invite route admin insert; portal server module |
| `accountant_deadline_notes` | on | — | Owner SELECT; accountant via token (server scope) | — |
| `accountant_access_log` | on | — | Owner SELECT (their own clients only) | Portal writes IP-hash entries |
| `reminder_log` | on | — | — | Service role (cron) |
| `reminder_preferences` | on | — | Owner ALL | Unsubscribe token resolves anon-via-URL; cron reads to fan out channels |
| `compliance_score_history` | on | — | Owner SELECT | Cron inserts via service role |
| `memberships` | on | — | Owner SELECT (own row) + admin role manage | Team invite + revoke flows |

## Platform / staff

| Table | RLS | anon | authenticated | service_role / notes |
|-------|-----|------|-----------------|----------------------|
| `platform_admins` | on | — | self SELECT only | Admin operations gated through `is_platform_admin()` RPC |
| `platform_admin_invites` | on | — | denied | Admin manage; `claim_platform_admin_invite(token)` RPC consumes with `FOR UPDATE` lock, 7-day expiry |
| `audit_events` | on | — | Owner SELECT for tenant events; admin SELECT cross-tenant | Cross-tenant write surface; `business_id` nullable for platform-level events (e.g. `platform.waitlist_invited`) |

## Regulatory / reference data (read-mostly)

| Table | RLS | anon | authenticated | service_role / notes |
|-------|-----|------|-----------------|----------------------|
| `regulatory_rules` | on | — | SELECT (RLS-open read for any authenticated user) | INSERT/UPDATE/DELETE only via `is_platform_admin()` RLS gate. Versioning RPC `version_regulatory_rule` forks v+1 and sets `superseded_by`. |
| `regulatory_rule_sources` | on | — | SELECT | INSERT only via admin/RPC. Provenance: `seed | accountant_correction | admin_edit | agency_scrape`. |

## Rate-limit / control

| Table | RLS | anon | authenticated | service_role / notes |
|-------|-----|------|-----------------|----------------------|
| `ai_rate_limits` | on | — | Owner ALL + atomic `try_consume_ai_rate_limit` RPC (SECURITY DEFINER, advisory tx lock) | RPC runs as definer; `auth.uid()` = invoker |
| `auth_rate_limits` | on | — | — (RPC-only) | `try_consume_auth_rate_limit(key, window, max)` SECURITY DEFINER; 5/15min default per (ip,email) |

## Public-write

| Table | RLS | anon | authenticated | service_role / notes |
|-------|-----|------|-----------------|----------------------|
| `waitlist_signups` | on | INSERT/SELECT denied at policy level | denied | API route uses service role insert; admin reads via `/admin/waitlist`. UTM + referral fields captured at write time. |

## Cache

| Table | RLS | anon | authenticated | service_role / notes |
|-------|-----|------|-----------------|----------------------|
| `ai_insight_cache` | on | — | Owner SELECT/INSERT keyed by context hash | 6-hour TTL; bypasses Anthropic on hit |

## Storage

| Bucket | RLS | Auth | Notes |
|--------|-----|------|-------|
| `documents` | on | Path first segment must equal a `businesses.id` owned by `auth.uid()` | Signed URLs minted by admin **after** ownership check on `documents` row |

---

## RPCs (SECURITY DEFINER unless noted)

| RPC | Purpose | Gate |
|-----|---------|------|
| `is_platform_admin()` | Single source of truth for platform-admin gating | reads `platform_admins` for `auth.uid()` |
| `claim_platform_admin_invite(p_token)` | Accept a platform-admin invite | `FOR UPDATE` row lock; expiry check; idempotent |
| `complete_onboarding(p_business, p_location, p_deadlines)` | Transactional 3-write business+location+deadlines insert | Authenticated owner |
| `try_consume_ai_rate_limit(p_business_id, p_max, p_window)` | Atomic per-business AI quota | Owner check via `auth.uid()` |
| `try_consume_auth_rate_limit(p_key, p_window, p_max)` | Generic throttle on auth endpoints (sign-in, sign-up) | Called server-side; `p_key` = `(action, ip, email)` |
| `version_regulatory_rule(p_id, p_changes)` | Fork a rule to v+1 with admin_edit provenance | `is_platform_admin()` |
| `record_share_view(p_token)` | Insert share-view analytics, increment counter | Anon callable; constrained to the token |
| `check_and_increment_rate_limit(...)` | Legacy generic counter (kept for older callsites) | Server-only |

## After policy changes

```bash
bun run security:db-lint   # supabase db lint
```

And use the Supabase Dashboard **Security Advisor** to catch RLS gaps and accidental `service_role` exposure in the browser.
