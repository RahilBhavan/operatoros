# Database

<!-- Last reviewed: 2026-05-16 — owner: rbhavanzim@gmail.com -->
<!-- Update trigger: any new file in supabase/migrations/. Add a row to §3 with what it added. -->

Schema overview, RPC catalog, migration index. For the row-level policy detail per table, see [`security/rls-matrix.md`](./security/rls-matrix.md).

---

## 1. Tables by domain

### Tenant core
| Table | What it stores |
|-------|----------------|
| `businesses` | One row per business. `owner_id = auth.uid()` is the tenant key. Carries onboarding profile (industry_slug, state, entity_type, employee range), Stripe billing fields (`stripe_customer_id`, `stripe_subscription_id`, `plan_tier`), and tier overrides written by platform admin. |
| `locations` | Additional locations (multi-state SMBs trigger state-fallback rules per location). |
| `memberships` | Additional users on a business (admin / member role enum). RLS reads `auth.uid()` against `user_id`. |
| `deadlines` | Materialized regulatory obligation per business. Links to `regulatory_rules.id` via `rule_id` + carries `rule_version` + `occurrence_key` for idempotent re-seeding. Carries severity, penalty_cents, source_url, statute_citation derived from the rule. |
| `documents` | Files attached to a deadline. Storage in the `documents` bucket; path first segment = `businesses.id`. |
| `document_versions` | Archived prior versions when a doc is replaced (via `/api/documents/[id]/replace`). |

### Regulatory rule graph (the moat)
| Table | What it stores |
|-------|----------------|
| `regulatory_rules` | Canonical, versioned rule. Columns: jurisdiction_type/code, industry_slug, rule_key, name, governing_agency, frequency, `due_date_rule` (jsonb, declarative), severity_tier, penalty_estimate_cents, source_url, statute_citation, effective_date, sunset_date, version, `superseded_by`, last_verified_at/by. Versioning RPC forks v+1; lookup query filters to head (`superseded_by IS NULL AND sunset_date IS NULL`). |
| `regulatory_rule_sources` | Provenance row per rule version: `source_kind ∈ {seed, accountant_correction, admin_edit, agency_scrape}` + source_ref. |

### Billing & reminders
| Table | What it stores |
|-------|----------------|
| `reminder_log` | One row per reminder sent. Cron writes via service role. |
| `reminder_preferences` | Per-business: channel toggles (email/sms/slack), digest-only flag, unsubscribe token, opt-out timestamp. |
| `compliance_score_history` | Daily snapshot of each business's score from the cron. Powers history charts + future peer benchmarks (Workstream C). |

### Share & accountant
| Table | What it stores |
|-------|----------------|
| `share_tokens` | Opaque 32-byte hex tokens for public read-only audit views. Configurable expiry, label, revocation timestamp. |
| `share_link_views` | View analytics. Inserted via `record_share_view(token)` RPC. |
| `accountant_connections` | Magic-link connections binding an accountant email to one or more businesses. 32-byte token, 90-day expiry, revocable. |
| `accountant_deadline_notes` | Notes an accountant leaves against a specific deadline. |
| `accountant_access_log` | IP-hashed entries written when an accountant loads a client portal — anti-abuse + audit. |

### Cache & rate limit
| Table | What it stores |
|-------|----------------|
| `ai_insight_cache` | Cached Anthropic completions keyed by (business_id, context_hash). 6-hour TTL. |
| `ai_rate_limits` | Per-business AI quota state. Consumed atomically via `try_consume_ai_rate_limit` RPC. |
| `auth_rate_limits` | Generic throttle bucket. Consumed via `try_consume_auth_rate_limit(action, ip, email)`. |

### Platform / staff
| Table | What it stores |
|-------|----------------|
| `platform_admins` | Cross-tenant staff identities. Source of truth for `is_platform_admin()`. |
| `platform_admin_invites` | One-time invite tokens. Claimed via `claim_platform_admin_invite(token)` RPC with `FOR UPDATE` row lock, 7-day expiry. |
| `audit_events` | Cross-tenant event stream. `business_id` is **nullable** so platform-level events (e.g. `platform.waitlist_invited`) can write without a tenant. Powers `/admin/audit`. |
| `audit_log` | Older per-tenant audit table (predates `audit_events`). Owner SELECT; server-only inserts. |

### Waitlist
| Table | What it stores |
|-------|----------------|
| `waitlist_signups` | Pre-launch email capture. UTM (source/medium/campaign/referrer/landing_path) + state/industry + referral code + invited_at. Anon insert via service role (RLS denies direct). |

---

## 2. RPC catalog

All `SECURITY DEFINER` unless noted. Always check the migration for the exact arguments.

| RPC | Purpose | Gate / invariant |
|-----|---------|------------------|
| `is_platform_admin()` | Single source of truth for platform-admin checks (used by RLS, gates, and routes) | Reads `platform_admins` for `auth.uid()` |
| `claim_platform_admin_invite(p_token)` | Accept a 7-day invite | `FOR UPDATE` row lock on the invite to prevent double-claim |
| `complete_onboarding(p_business, p_location, p_deadlines)` | Transactional 3-write business+location+deadlines insert | Caller authenticated; new business owned by `auth.uid()` |
| `try_consume_ai_rate_limit(p_business_id, p_max, p_window)` | Atomic per-business AI quota with advisory transaction lock | Caller must own (or be member of) the business |
| `try_consume_auth_rate_limit(p_key, p_window, p_max)` | Generic throttle on auth flows | Called server-side; `p_key` = `(action, ip, email)` |
| `version_regulatory_rule(p_id, p_changes jsonb)` | Fork rule to v+1: writes new row with `version = old.version + 1`, sets `superseded_by` on the prior, writes `audit_events` (`platform.rule_versioned`) and `regulatory_rule_sources` with `source_kind='admin_edit'` | `is_platform_admin()` |
| `record_share_view(p_token)` | Insert view, increment counter | Anon callable; constrained by token validity |
| `check_and_increment_rate_limit(...)` | Older generic counter; kept for legacy callsites | Server-only |
| `touch_regulatory_rules_updated_at()` | Trigger to bump `updated_at` on rule mutation | Trigger |
| `update_updated_at()` | Generic `updated_at` trigger | Trigger |

---

## 3. Migration index

Migrations live in `supabase/migrations/`. The convention is `YYYYMMDD<seq>_<slug>.sql`. To apply: `bun run db:push`. To regenerate types after applying: `bun run db:types`.

| Migration | What it added |
|-----------|----------------|
| `20260513000001_waitlist.sql` | `waitlist_signups` + RLS-denies |
| `20260513000002_core_tables.sql` | `businesses`, `locations`, `deadlines`, `documents`, `audit_log` + owner RLS |
| `20260513000003_storage.sql` | `documents` bucket policies (path[0] = businesses.id ownership) |
| `20260513000004_billing.sql` | Stripe billing fields on `businesses` |
| `20260514000001_share_anon_policies.sql` | (Removed in `_security_share_storage_ai`) — early anon read for share. Use server token loader. |
| `20260514000003_ai_accountant_score_history.sql` | `accountant_connections`, `compliance_score_history` |
| `20260514000004_fix_rls_and_portfolio.sql` | Owner-via-business policies for portfolio queries |
| `20260514000005_ai_rate_limits.sql` | `ai_rate_limits` |
| `20260514000006_atomic_rate_limit_rpc.sql` | `try_consume_ai_rate_limit` SECURITY DEFINER + advisory lock |
| `20260514000007_accountant_notes.sql` | `accountant_deadline_notes` |
| `20260515000001_add_accountant_pro_tier.sql` | Earlier 4-tier scaffolding (superseded by 2-tier) |
| `20260515000002_security_hardening.sql` | RLS tightening across share/accountant/AI |
| `20260515000003_security_share_storage_ai.sql` | Removed broad anon policies; added server-token surfaces |
| `20260515000004_revoke_anon_rate_limit.sql` | Revoked anon role from rate-limit table |
| `20260515000004_two_tier_pricing.sql` | Migrated plan enum to `business` / `accountant` |
| `20260515000005_rename_industry_slug.sql` | `industry_sic_code` → `industry_slug` (stored slugs) |
| `20260515000006_feature_moat_upgrade.sql` | Severity / penalty / source_url / statute_citation on `deadlines`; share-token governance; accountant expiry + `accountant_access_log`; `reminder_preferences`; `audit_events`; `ai_insight_cache`; `document_versions`; waitlist state + referral |
| `20260515000007_platform_admin.sql` | `platform_admins`, `platform_admin_invites`, `is_platform_admin()`, `claim_platform_admin_invite()` |
| `20260515000008_admin_helpers.sql` | `waitlist.invited_at` + admin helpers |
| `20260515000009_platform_audit_events.sql` | Made `audit_events.business_id` nullable for platform-level events |
| `20260516000001_deadline_rule_metadata.sql` | `deadlines.rule_id` / `rule_version` / `occurrence_key` + partial unique index for idempotent re-seeding |
| `20260516000002_complete_onboarding_rpc.sql` | Transactional `complete_onboarding` RPC |
| `20260516000003_auth_rate_limit.sql` | `auth_rate_limits` + `try_consume_auth_rate_limit` |
| `20260516000004_regulatory_rules.sql` | `regulatory_rules` + `regulatory_rule_sources` + lookup/stale/unverified partial indices + RLS via `is_platform_admin()` |
| `20260516000005_regulatory_rules_seed.sql` | 91 rule rows (federal + 5 explicit states + state-fallback templates). Regenerated via `WRITE_SEED=1 bun run test`. |
| `20260516000006_regulatory_rule_versioning.sql` | `version_regulatory_rule(p_id, p_changes)` RPC |
| `20260516000007_deadlines_rule_id_backfill.sql` | Idempotent CTE-based backfill of `deadlines.rule_id` where (name, agency, frequency, severity) is unambiguous |

---

## 4. Adding a migration

1. New file: `supabase/migrations/<YYYYMMDD><seq>_<slug>.sql`. Choose `<seq>` to keep total ordering (look at the latest file).
2. Write the migration. **Idempotent if possible** (`create table if not exists`, `create policy ... if not exists` via DO blocks, partial unique indices for re-seeding).
3. **RLS first**: if you `create table`, also `alter table ... enable row level security` and add policies in the same migration. The pre-merge bar in `docs/roadmap/WORLD_CLASS.md` §0 explicitly forbids tables shipping without policies.
4. Apply locally: `bun run db:push`. Regenerate types: `bun run db:types`.
5. Run `bun run security:db-lint` and skim the Supabase Dashboard Security Advisor.
6. **Update three docs in the same PR:** add a row to §1 of this file, add a row to §3 (migration index), add the table to [`security/rls-matrix.md`](./security/rls-matrix.md). If the migration adds a new RPC, add a row to §2 above and to the `rls-matrix` RPC table.
7. PR template asks you to tick all of the above.

---

## 5. Regenerating the regulatory-rule seed

The seed migration (`20260516000005_regulatory_rules_seed.sql`) is generated from the TypeScript source of truth (`src/lib/regulatory-graph.ts` `LEGACY_RULES`). To regenerate:

```bash
WRITE_SEED=1 bun run test src/__tests__/lib/regulatory-graph-seed.test.ts
```

The drift guard (`regulatory-graph-seed.test.ts`) fails CI if `LEGACY_RULES` and the migration disagree. Always re-run the seed-write after editing rules in `regulatory-graph.ts`.
