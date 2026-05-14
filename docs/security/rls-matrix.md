# RLS and role matrix

Supabase roles: **anon** (public anon key), **authenticated** (user JWT), **service_role** (admin key; server-only).

| Table | RLS | anon | authenticated | service_role / notes |
|-------|-----|------|-----------------|----------------------|
| `waitlist_signups` | on | No SELECT/INSERT (policies false) | Same | API route uses service role insert |
| `businesses` | on | No tenant read (share anon policies removed — use server token path) | Owner `owner_id = auth.uid()` all | Cron, webhooks, token loaders |
| `deadlines` | on | No broad anon read (removed) | Owner via business | Cron, token loaders |
| `locations` | on | — | Owner via business | — |
| `documents` | on | — | Owner via business | — |
| `audit_log` | on | — | Owner SELECT | Inserts via trusted server only |
| `reminder_log` | on | — | — | Service role (cron) |
| `share_tokens` | on | No anon SELECT | Owner manage | Token validation server-side |
| `accountant_connections` | on | — | Owner ALL | Invite route admin insert; portal server module |
| `compliance_score_history` | on | — | Owner SELECT | Cron inserts via service role |
| `ai_rate_limits` | on | — | Owner ALL + RPC `try_consume_ai_rate_limit` SECURITY DEFINER | RPC runs as definer; `auth.uid()` = invoker |
| `storage.objects` (`documents` bucket) | on | — | Path first segment = `businesses.id` owned by `auth.uid()` | Signed URL path uses admin after ownership check |

Migrations live under `supabase/migrations/`. After policy changes, run `supabase db lint` and Dashboard **Security Advisor**.
