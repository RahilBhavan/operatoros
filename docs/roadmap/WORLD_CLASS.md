# World-Class Roadmap

> Source of truth for closing every deferred item in `MEMORY.md` and turning OperatorOS from a deadline tracker into a defensible, fundable product. Moat-first sequencing. One workstream per PR. Each workstream ships only when `tsc` is clean, `vitest` is green, `next build` succeeds, and a manual e2e walkthrough passes.

Last reviewed: 2026-05-15 · author: rbhavanzim@gmail.com

---

## 0 · Goal & Rubric

**Goal.** Close every deferred item in `MEMORY.md` so the panel rubric "moat + hyper-functional + compounds with adjacent features + world-class UX" holds not just per-feature but per-feature-pair. After this roadmap lands, the answer to "what stops a competitor with a weekend and Claude" is concrete: the regulatory graph, the accountant-corrections loop, peer benchmarks, and the viral attribution flywheel — none of which can be cloned by reading the UI.

**Rubric (per workstream, before merge):**
1. **Moat or functional bar.** Either makes the data/network harder to clone, or fixes a quality gap that breaks "fully functional."
2. **No half-finished surface.** Every new schema field is read somewhere; every new UI control wires through to a real backend; every new API has an end-to-end test.
3. **Audit + RLS clean.** Every cross-tenant or admin write logs to `audit_events`. RLS denies by default; new tables ship with policies.
4. **Verification.** `tsc --noEmit` clean · `vitest run` 100% pass · `next build` succeeds · `eslint` 0 errors · 1 manual e2e walkthrough documented in the PR.

**Out of scope for code.** Items I cannot close without a human: real legal review (need counsel or Termly/iubenda), customer logos (need first paying customers). These are tracked in Workstream I as launch-hygiene gates, not engineering tasks.

---

## 1 · Deferred Items → Workstream Map

Every item in `MEMORY.md` is assigned an owner workstream. Nothing is dropped.

| # | Deferred item | Session | Workstream |
|---|---|---|---|
| 1 | Proprietary 50-state regulatory graph | Website-validity | **A** Regulatory graph |
| 2 | Replace `buildStarterDeadlines` with agentic discovery | Website-validity | **A** Regulatory graph |
| 3 | Rule-confidence + accountant-flagged corrections | Feature-moat | **B** Corrections loop |
| 4 | Peer benchmark scoring (median CA restaurant: 81) | Feature-moat | **C** Peer benchmarks |
| 5 | Viral attribution / `invited_by_accountant_id` | Website-validity | **D** Viral attribution |
| 6 | PostHog/Mixpanel full-funnel analytics | Website-validity | **E** Funnel analytics |
| 7 | Stripe-truth MRR from `stripe_subscriptions` | Platform-admin | **F** Stripe-truth MRR |
| 8 | SMS / Slack reminder channels | Feature-moat | **G** Multi-channel reminders |
| 9 | Full impersonation (act-as-user 1hr) | Platform-admin | **H** Operational polish |
| 10 | CHECK constraint: actor_user_id when business_id null | Platform-admin | **H** Operational polish |
| 11 | Error logging on platform audit_event insert | Platform-admin | **H** Operational polish |
| 12 | Tooltip on long-email confirm state | Platform-admin | **H** Operational polish |
| 13 | In-code or Vercel-WAF waitlist rate limit | Publish-readiness | **H** Operational polish |
| 14 | Nonce-based CSP (drop `'unsafe-inline'`) | Publish-readiness | **H** Operational polish |
| 15 | Real legal review of ToS/Privacy | Multiple | **I** Launch hygiene (non-code) |
| 16 | Customer logos on landing | Feature-moat | **I** Launch hygiene (non-code) |

---

## 2 · Dependency DAG

```
  A (Regulatory graph)
     │
     ├──> B (Corrections loop)   ──┐
     │                              ├──> C (Peer benchmarks)
     └──────────────────────────────┘
                │
                └──> D (Viral attribution)   [needs corrections-flow trust]

  E (Funnel analytics)    ── independent, start anytime
  F (Stripe-truth MRR)    ── independent
  G (Multi-channel)       ── independent
  H (Ops polish)          ── independent, mostly small
  I (Launch hygiene)      ── parallel; not code work
```

**Critical path:** A → B → C, then D. E/F/G/H run in parallel with main path. Recommended cadence: 1 main-path workstream + 1 parallel workstream per week, alternating PRs.

---

## 3 · Workstreams

### Workstream A · Regulatory Graph (the foundation)

**Goal.** Replace the hardcoded `buildStarterDeadlines()` in `src/lib/seed-deadlines.ts` with a queryable rules graph stored in Postgres, versioned, citation-backed, and editable through admin tooling. This is the dataset competitors cannot rebuild in a weekend.

**Why it's the moat.** Today: 1 file, ~50 industries × federal-only, hardcoded due dates. After A: 50 states × N industries × M rule families, each row carrying agency, statute, source URL, severity, penalty cents, effective_date, sunset_date, last_verified_at, last_verified_by — all the substrate the corrections loop (B) writes into and the confidence score (B) reads from.

**Schema (migration `20260516000001_regulatory_graph.sql`):**

```sql
-- The canonical rule, versioned.
create table public.regulatory_rules (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_type text not null check (jurisdiction_type in ('federal','state','local')),
  jurisdiction_code text not null,                  -- 'US', 'CA', 'NYC', etc.
  industry_slug text,                                -- null = applies to all
  rule_key text not null,                            -- stable slug, e.g. 'irs-form-941-quarterly'
  name text not null,
  description text not null,
  governing_agency text not null,
  frequency text not null,                           -- 'quarterly' | 'annual' | 'monthly' | 'one_time' | 'event_driven'
  due_date_rule jsonb not null,                      -- declarative: { kind: 'fixed', month: 4, day: 30 } | { kind: 'days_after_qtr_end', offset: 30 } | ...
  severity_tier text not null check (severity_tier in ('critical','high','medium','low','info')),
  penalty_estimate_cents bigint,
  source_url text,
  statute_citation text,
  effective_date date not null,
  sunset_date date,
  version integer not null default 1,
  superseded_by uuid references public.regulatory_rules(id),
  last_verified_at timestamptz,
  last_verified_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (jurisdiction_code, industry_slug, rule_key, version)
);

create index regulatory_rules_lookup on public.regulatory_rules
  (jurisdiction_code, industry_slug, frequency)
  where sunset_date is null;

-- Provenance of where each rule came from (manual seed, accountant correction, etc.)
create table public.regulatory_rule_sources (
  rule_id uuid references public.regulatory_rules(id) on delete cascade,
  source_kind text not null check (source_kind in ('seed','accountant_correction','admin_edit','agency_scrape')),
  source_ref text,                                   -- correction_id, scrape_run_id, etc.
  created_at timestamptz not null default now()
);

-- Link each deadline instance back to the rule that generated it (for confidence + correction propagation).
alter table public.deadlines add column rule_id uuid references public.regulatory_rules(id);
create index deadlines_rule_id on public.deadlines(rule_id);
```

**RLS:** `regulatory_rules` and `regulatory_rule_sources` are `SELECT` for `authenticated`, `INSERT/UPDATE/DELETE` only via `is_platform_admin()` RPC or the corrections-merge RPC (Workstream B).

**Code changes:**
- `src/lib/regulatory-graph.ts` (new) — query helper: `getApplicableRules({ state, industry, asOf })` returns `RegulatoryRule[]` ordered by severity.
- `src/lib/seed-deadlines.ts` — replace `buildStarterDeadlines()` body with a call to `getApplicableRules()` and a small `materializeDeadlinesFromRules()` helper. Keep the old function name + signature so callers don't change. Old hardcoded data becomes the seed for the new table (a one-time migration script in `supabase/seeds/regulatory_rules_seed.sql`).
- `src/lib/deadline-utils.ts` — `due_date_rule` evaluator (one function per `kind`: `fixed`, `days_after_qtr_end`, `nth_weekday`, `days_after_fiscal_year_end`).
- New admin pages:
  - `/admin/rules` — list with filters (jurisdiction, industry, last_verified before, sunset upcoming).
  - `/admin/rules/[id]` — edit, with "Save as new version" (sets `superseded_by` on the prior row, increments `version`).
- New API: `POST /api/admin/rules/[id]/verify` — stamps `last_verified_at`, writes `audit_events`.

**Acceptance criteria:**
- All ~existing seed deadlines from `seed-deadlines.ts` are migrated into `regulatory_rules` with `source_kind='seed'`. Existing `deadlines` rows backfilled with `rule_id` where match is unambiguous.
- New business onboarding produces the same set of deadlines as before for the same input — verified by snapshot test in `src/__tests__/onboarding-snapshot.test.ts`.
- `/admin/rules` shows 50-state coverage gaps (rules with `jurisdiction_type='state'` and missing states).
- `/admin/rules/[id]` versioning round-trips: editing a rule creates v2 with `superseded_by` pointing back; the lookup query returns only the unsuperseded row.
- Verification: + 1 vitest spec for the `due_date_rule` evaluator (every `kind` × edge cases), + 1 spec for snapshot equivalence with the old builder.

**Estimate.** 5–7 working days. The schema is half a day; the seed migration is the slow part (need to actually fill in the 50-state matrix, even with `state_coverage='unknown'` placeholders for the cells we haven't researched).

**Out of scope here:** scraping agency websites to populate state rules (Workstream A.2, future). For now we ship the substrate with federal rules fully populated and state rules marked `last_verified_at IS NULL` for the corrections loop to fill in.

---

### Workstream B · Accountant Corrections Loop

**Goal.** Every $299 accountant on the platform can flag a rule as wrong, suggest a correction (with citation), and watch it flow through admin review into the canonical graph. Each rule gets a confidence score derived from the corrections history. Business-side deadlines show the confidence inline.

**Why it's the moat.** This is the compounding loop: more accountants → more corrections → better rules → more accurate deadlines → more business adoption → more accountants. The corrections dataset itself is the second-order moat (a labeled, expert-verified, citation-backed regulatory dataset is rare and valuable in its own right).

**Depends on:** Workstream A (needs `regulatory_rules`).

**Schema (migration `20260516000002_corrections_loop.sql`):**

```sql
create table public.rule_corrections (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.regulatory_rules(id),
  proposed_by uuid not null references auth.users(id),     -- accountant
  proposed_by_kind text not null check (proposed_by_kind in ('accountant','admin','business_member')),
  proposed_changes jsonb not null,                          -- partial rule diff
  rationale text not null,                                  -- accountant explanation
  citation_url text,                                        -- supporting citation
  status text not null default 'pending' check (status in ('pending','accepted','rejected','superseded')),
  reviewed_by uuid references auth.users(id),               -- admin
  reviewed_at timestamptz,
  review_note text,
  resulting_rule_id uuid references public.regulatory_rules(id),  -- new version on accept
  created_at timestamptz not null default now()
);

create index rule_corrections_status_pending on public.rule_corrections(status) where status = 'pending';
create index rule_corrections_by_rule on public.rule_corrections(rule_id, status);

-- Derived per-rule confidence, materialized hourly.
create materialized view public.rule_confidence as
select
  r.id as rule_id,
  case
    when count(c.*) filter (where c.status = 'rejected') > 2 then 'low'
    when r.last_verified_at is null then 'unverified'
    when r.last_verified_at < now() - interval '180 days' then 'stale'
    when count(c.*) filter (where c.status = 'accepted') >= 1 then 'community_validated'
    else 'baseline'
  end as confidence_tier,
  count(c.*) filter (where c.status = 'accepted') as accepted_corrections,
  count(c.*) filter (where c.status = 'pending')  as pending_corrections,
  r.last_verified_at
from public.regulatory_rules r
left join public.rule_corrections c on c.rule_id = r.id
where r.sunset_date is null
group by r.id;

create unique index rule_confidence_pk on public.rule_confidence(rule_id);
```

**Refresh strategy:** `pg_cron` hourly refresh (`refresh materialized view concurrently public.rule_confidence`). Fall back to an Edge Function on a cron schedule if `pg_cron` isn't enabled. Add to the existing `cron` API directory.

**RLS:**
- `rule_corrections` — accountants can `SELECT` their own + `INSERT` new; admins (`is_platform_admin()`) full access.
- `rule_confidence` — public read for authenticated users.

**Code changes:**
- Accountant portal (`src/app/accountant/[token]/...`) — every deadline card on a client view gets a "Flag this rule" button. Opens a modal: textarea for rationale, optional citation URL, optional structured diff (severity / due date / agency).
- New API: `POST /api/accountant/corrections` — auth gated to active accountant connection, rate-limited (10/hr/accountant), writes correction + audit_event.
- New admin pages:
  - `/admin/corrections` — queue of pending corrections, sortable by rule severity × correction count.
  - `/admin/corrections/[id]` — review screen: rule current state on left, proposed diff on right, Accept/Reject buttons. Accept calls `accept_correction(correction_id)` RPC which creates v+1 of the rule (with `source_kind='accountant_correction'`), sets `superseded_by`, sets correction status, writes audit.
- Business-side dashboard — confidence badge on each deadline card. `unverified`/`stale` get a subtle gray tag; `community_validated` gets a green checkmark with tooltip "Verified by N accountants."

**Acceptance criteria:**
- Accountant on a real client portal can submit a correction, see it appear in `/admin/corrections` within 5s.
- Admin Accept produces a new rule version; subsequent new businesses with the matching profile get the new version (verified via integration test).
- Confidence badge shows on the business dashboard within 1 hour of admin Accept (materialized view refresh window).
- All correction state transitions write `audit_events` with the actor.
- 1 vitest spec for the `accept_correction` RPC (race condition: two admins accepting simultaneously — second one gets a `correction_already_resolved` error).

**Estimate.** 4–5 working days.

---

### Workstream C · Peer Benchmark Scoring

**Goal.** On the business dashboard, each user sees their compliance score next to the median score for businesses of the same industry × state, with k-anonymity protection (only show benchmark if N ≥ 10).

**Why it's the moat.** Network-effect on the score itself — your score only becomes more meaningful as more peers join. Closes Hoffman's note from the feature-moat consensus. Also doubles as a conversion lever: "67th percentile vs. CA restaurants" is more visceral than "your score: 73."

**Depends on:** Workstream A (rules already populated so scoring is comparable across tenants). Optional dependency on B — adoption of B raises confidence in the underlying rules.

**Schema (migration `20260516000003_peer_benchmarks.sql`):**

```sql
-- Materialized weekly. Only emit rows where cohort size >= 10 to enforce k-anonymity.
create materialized view public.industry_benchmarks as
select
  b.industry_slug,
  b.state_code,
  count(*) as cohort_size,
  percentile_cont(0.25) within group (order by sh.score) as p25,
  percentile_cont(0.50) within group (order by sh.score) as median,
  percentile_cont(0.75) within group (order by sh.score) as p75,
  percentile_cont(0.90) within group (order by sh.score) as p90,
  max(sh.captured_at) as last_captured_at
from public.businesses b
join lateral (
  select score, captured_at
  from public.score_history
  where business_id = b.id
  order by captured_at desc
  limit 1
) sh on true
group by b.industry_slug, b.state_code
having count(*) >= 10;

create unique index industry_benchmarks_pk on public.industry_benchmarks(industry_slug, state_code);
```

**RLS:** public read for authenticated users — no PII, only aggregates above the k-anonymity threshold.

**Refresh strategy:** Sunday 02:00 UTC via `pg_cron` or Edge cron. One weekly refresh is enough — peer scores move slowly.

**Code changes:**
- `src/lib/benchmarks.ts` (new) — `getPeerContext(businessId)` returns either `{ cohortSize, percentile, median, p25, p75, p90 }` or `null` if cohort < 10.
- Dashboard score widget — augmented with a horizontal percentile bar when a peer context exists. Tooltip explains the cohort: "Based on N CA restaurants tracked on OperatorOS."
- Empty state when no cohort: "Be the first NV plumber on OperatorOS — peer benchmarks unlock at 10 businesses."
- Admin surface: `/admin` already has plan-distribution chart; add a sparkline of `cohort_size_total` over time so we can see network density growing.

**Acceptance criteria:**
- New business with 0 peers sees the empty state, no leakage of small-cohort numbers.
- Test cohort with 10+ synthetic businesses surfaces the percentile bar with correct math (verified via test fixture + 1 vitest spec).
- No PII in `industry_benchmarks` (verified by schema test that the view's columns are limited to the listed aggregates).
- Refresh cron runs and updates `last_captured_at`.

**Estimate.** 2–3 working days.

---

### Workstream D · Viral Attribution

**Goal.** Accountants can invite their clients to OperatorOS with a tracked link. Attribution flows through onboarding to a `businesses.invited_by_accountant_id`. Accountants see a "Clients you brought in" panel with MRR generated.

**Why it's the moat.** Channel that competitors don't have access to. Each accountant is incentivized to bring their full book (10–200 SMBs each). Closes Hoffman's note from the website-validity consensus.

**Depends on:** Trust signal from B (accountants are more likely to invite clients to a tool whose rules they've vetted), so order after B. Schema can ship earlier if needed.

**Schema (migration `20260516000004_viral_attribution.sql`):**

```sql
alter table public.businesses add column invited_by_accountant_id uuid references auth.users(id);
alter table public.businesses add column invite_code text;
create index businesses_invited_by_accountant on public.businesses(invited_by_accountant_id);

create table public.accountant_invite_links (
  id uuid primary key default gen_random_uuid(),
  accountant_id uuid not null references auth.users(id),
  code text not null unique,                          -- short, URL-safe
  label text,                                          -- "Q1 restaurant push"
  signups_count integer not null default 0,
  paid_conversions_count integer not null default 0,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index accountant_invite_links_by_accountant on public.accountant_invite_links(accountant_id);
```

**RLS:** accountants see their own links and their own invited businesses; admins see all.

**Code changes:**
- `/accountant/[token]/invites` (new) — accountant creates a code, sees their link `https://operatoros.app/i/<code>`, shares manually or copies into an email.
- `/i/[code]` route — sets `invite_code` cookie (1 hour TTL), redirects to `/signup?utm_source=accountant&utm_medium=invite_link&utm_campaign=<code>`.
- `signup` flow — reads cookie on business creation, populates `businesses.invited_by_accountant_id` + `businesses.invite_code`, increments `accountant_invite_links.signups_count`.
- Stripe webhook handler — on first successful `subscription.created`, increments `paid_conversions_count` if `invite_code` present.
- Accountant dashboard — new "Network growth" card: signups, paid conversions, total MRR you've sourced.
- Admin: `/admin/businesses` filter for `invited_by_accountant_id IS NOT NULL`; new column "Acquired via."

**Acceptance criteria:**
- Visiting `/i/<code>` and signing up correctly links the resulting business to the accountant.
- Cookie expires; visiting a code link 2 hours later and signing up does NOT link.
- Accountant cannot increment another accountant's counters (RLS).
- Revoked link `/i/<code>` returns 410 Gone.
- 1 vitest spec for the attribution end-to-end (cookie → signup → business row → counter increment).

**Estimate.** 3 working days.

**Optional follow-on (not in this PR):** revenue-share economics. That's a business decision (10% lifetime? flat $50/converted client?), not a plumbing change. Schema supports it; UI/Stripe lifts deferred.

---

### Workstream E · Full-Funnel Analytics

**Goal.** Wire PostHog (or self-hosted alternative) end-to-end so we can answer "what % of landing visitors become paying customers in 30 days." Surface key funnels in `/admin`.

**Why it matters.** Today UTM capture exists on the waitlist form only. We have zero visibility into the signup → first-deadline → first-reminder → upgrade funnel. Closes the Meeker/Doerr/Gurley deferred items.

**Independent of A/B/C/D.** Can ship anytime.

**Choice point.** PostHog cloud ($0 for <1M events/mo, fast) vs. self-hosted PostHog (full data ownership, ops burden). **Recommendation: PostHog cloud** for now; revisit at 100k events/month.

**Code changes:**
- `src/lib/analytics.ts` (new) — typed event emitter wrapping PostHog SDK with a no-op stub when `NEXT_PUBLIC_POSTHOG_KEY` is absent (keeps tests deterministic).
- Event taxonomy (events.md in `docs/analytics/`):
  - `page_viewed` (auto via PostHog)
  - `signup_started`, `signup_completed`, `oauth_used`
  - `onboarding_step_completed { step }`, `onboarding_completed`
  - `deadline_marked_done`, `deadline_snoozed`
  - `share_link_created`, `share_link_viewed`
  - `reminder_sent { channel, severity }`, `reminder_opened`
  - `accountant_connected`, `accountant_correction_submitted`
  - `upgrade_started`, `upgrade_completed { tier }`
  - `churn { reason }`
- Reverse-ETL into `/admin`: a "Funnels" tab showing 4 canned funnels (landing → signup → onboard → first-deadline-action → first-reminder → upgrade).
- Identify on auth: `posthog.identify(userId, { plan_tier, role, invited_by_accountant_id, state })` so cohorts work.

**Acceptance criteria:**
- `pnpm dev` with no PostHog key set: no errors, events go to no-op.
- With key set: each enumerated event fires on the right user action (verified via PostHog live events panel — documented in PR).
- `/admin/funnels` shows the four canned funnels with non-zero counts after a manual e2e run.
- No PII (email, name) sent as event properties; only IDs and categorical tier fields.

**Estimate.** 2–3 working days.

---

### Workstream F · Stripe-Truth MRR

**Goal.** Pull MRR directly from Stripe subscription state mirrored into a local table, not from `businesses.stripe_*` columns. Admin dashboard MRR loses the "not Stripe-source-of-truth" caveat.

**Why it matters.** Tonight the MRR shown to admin is computed from `plan_tier × count_of_businesses`. If a Stripe webhook is missed, the number drifts silently. Closes Meeker's note.

**Independent.** Can ship anytime.

**Schema (migration `20260516000005_stripe_subscriptions.sql`):**

```sql
create table public.stripe_subscriptions (
  id text primary key,                                -- Stripe subscription id, sub_xxx
  business_id uuid references public.businesses(id) on delete set null,
  customer_id text not null,                          -- cus_xxx
  status text not null,                               -- active|trialing|past_due|canceled|...
  price_id text not null,
  plan_tier text not null check (plan_tier in ('business','accountant')),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_end timestamptz,
  unit_amount_cents bigint not null,
  currency text not null default 'usd',
  updated_at timestamptz not null default now()
);

create index stripe_subscriptions_business on public.stripe_subscriptions(business_id);
create index stripe_subscriptions_status on public.stripe_subscriptions(status);
```

**Code changes:**
- Stripe webhook (`src/app/api/billing/webhook/route.ts`) — on `customer.subscription.created|updated|deleted`, upsert into `stripe_subscriptions`.
- Admin MRR queries this table: `sum(unit_amount_cents) where status in ('active','trialing')`.
- Backfill script (`scripts/stripe-subscription-backfill.ts`) — page through all Stripe subs and upsert. Run once after migration.

**Acceptance criteria:**
- Webhook events on a Stripe test subscription update the table within 1s.
- Admin MRR matches Stripe's billing summary for the test mode account, to the penny.
- Backfill script is idempotent (re-running doesn't duplicate or zero anything).

**Estimate.** 1–2 working days.

---

### Workstream G · Multi-Channel Reminders (SMS / Slack)

**Goal.** Reminders that today go via email also go via SMS (Twilio) and Slack DM/channel where the user has opted in. `reminder_preferences` already has the column scaffolding.

**Why it matters.** Compliance deadlines live or die by whether the reminder is seen. Email open rates are 20-30%; SMS is ~95%. Closes the deferred SMS/Slack item.

**Independent.** Can ship anytime.

**Schema (migration `20260516000006_reminder_channels.sql`):**

```sql
alter table public.reminder_preferences
  add column sms_enabled boolean not null default false,
  add column sms_phone_e164 text,
  add column sms_verified_at timestamptz,
  add column slack_enabled boolean not null default false,
  add column slack_team_id text,
  add column slack_channel_id text,                   -- DM or channel
  add column slack_access_token_encrypted text;       -- encrypted with pgcrypto

create table public.sms_verifications (
  user_id uuid primary key references auth.users(id),
  phone_e164 text not null,
  code text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);
```

**Code changes:**
- `src/lib/sms.ts` (new) — Twilio client wrapper. `sendSms(toE164, body)`, `verifyCode(userId, code)`.
- `src/lib/slack.ts` (new) — Slack OAuth + chat.postMessage wrapper.
- Settings page `/settings/reminders`:
  - SMS section: phone input (E.164), "Send code", verify, "STOP to opt out" disclosure for CTIA compliance.
  - Slack section: "Connect Slack" OAuth button → picks DM or channel.
- Reminder cron (`src/app/api/cron/reminders/route.ts`) — fan out across enabled channels per user; track `audit_events` per send.
- Inbound SMS handler `/api/twilio/sms-inbound` — STOP keyword sets `sms_enabled=false`; HELP keyword replies with support contact.

**Acceptance criteria:**
- User on Business tier can verify a phone, enable SMS, and receive a deadline reminder via SMS on the same date the email goes out.
- STOP keyword disables SMS within 1 message.
- Slack OAuth round-trip works in dev with a Slack test workspace.
- No reminder is sent on a disabled channel (verified by 1 vitest spec for the dispatch fan-out logic).
- Encryption of Slack access tokens verified — raw token never readable via SQL without `pgsodium`/`pgcrypto` key.

**Estimate.** 4–5 working days (Twilio compliance + Slack OAuth are the slow parts).

---

### Workstream H · Operational Polish (the small but unfinished)

Six small items from the deferred list. Bundle as one PR.

**1. Full impersonation (act-as-user 1 hour).**
- Migration `20260516000007_impersonation.sql`: `impersonation_sessions (admin_id, target_user_id, expires_at, ended_at, reason)`.
- API `POST /api/admin/impersonate { user_id, reason }` → mints a short-lived session token (1hr), redirects admin to dashboard as user.
- Blanket WRITE block: middleware refuses any mutating route while impersonation token is active (audit only).
- Banner across top of all pages: "Impersonating <email> · Exit." with timer.
- `audit_events`: `platform.impersonation_started` + `platform.impersonation_ended`.

**2. CHECK constraint on `audit_events`.**
- Migration `20260516000008_audit_events_check.sql`:
  ```sql
  alter table public.audit_events
    add constraint audit_events_actor_required
    check (business_id is not null or actor_user_id is not null);
  ```
- Test: an INSERT with both null raises a constraint violation.

**3. Error logging on platform audit_event insert.**
- All admin API routes wrap the audit insert in `try { ... } catch (e) { log.error('audit_insert_failed', { event_type, error: e }); }`.
- Currently silently no-op — add `src/lib/log.ts` if a logger doesn't exist; otherwise use the existing one.

**4. Tooltip on admin Promote confirm state.**
- `/admin/waitlist`: when the email is long enough to truncate in the confirm chip, show full email in a `<Tooltip>` on hover.

**5. Vercel WAF rate limit on `/api/waitlist`.**
- Vercel dashboard config (not code): WAF rule, 10 req/min/IP for `POST /api/waitlist`.
- Documented in `docs/security/threat-models.md` as completed, with screenshot.

**6. Nonce-based CSP.**
- `proxy.ts`: generate per-request nonce, set header `Content-Security-Policy: script-src 'self' 'nonce-<n>'` (drops `'unsafe-inline'`).
- Pass nonce through `headers()` to the root layout; every `<Script>` in the app reads it.
- Verify with `npx next build` + manual smoke that no script is blocked.

**Acceptance criteria.**
- Each of the six tasks ships with the migration / code change verified. Impersonation is the largest sub-item.
- 1 e2e walkthrough per sub-item in the PR description.

**Estimate.** 3–4 working days for the bundle (impersonation is half of it).

---

### Workstream I · Launch Hygiene (non-code)

Not engineering work, tracked here so it doesn't get forgotten.

**1. Real legal review.** Engage a law firm or Termly/iubenda to replace the draft ToS/Privacy. Replace `/terms` and `/privacy` content + remove the draft banner. Owner: founder. Gate: before any paying customer is charged.

**2. Customer logos on landing.** After first 3-5 paying customers, request permission and add logo strip to landing. Owner: founder. Gate: post-launch.

---

## 4 · Cadence (suggested 6-week run)

Assumes one engineer (you + me) at ~3 effective coding days/week.

| Week | Main path | Parallel |
|---|---|---|
| 1 | A.1: Regulatory graph schema + seed migration | — |
| 2 | A.2: Replace `buildStarterDeadlines` + admin UI | F: Stripe-truth MRR |
| 3 | B.1: Corrections schema + accountant flag UI | E: PostHog wiring |
| 4 | B.2: Admin review flow + confidence badge | H: ops polish bundle |
| 5 | C: Peer benchmarks | G.1: SMS channel |
| 6 | D: Viral attribution | G.2: Slack channel |

**Exit criteria for the roadmap as a whole:**
- Every row in §1's table moves to "shipped" (except Workstream I, which is non-code).
- `MEMORY.md` is updated with one Session entry per workstream PR, with the same structure as existing entries.
- Re-run the 10-GP feature-moat consensus loop; aim for unanimous YES on the now-implemented items (regulatory graph, corrections, benchmarks, viral) under the same rubric used in `docs/vc-review/features/CONSENSUS.md`.

---

## 5 · Risks & how we mitigate

- **A is the long pole.** Filling the 50-state matrix is research-heavy. Mitigation: ship the schema + federal-only rules in week 1, mark state cells `unverified`. The corrections loop in week 3 then fills them in via accountant contributions — turning a research task into a community task. This is the whole moat thesis.
- **B is silent for ~90 days.** Until we have paying accountants flagging things, the corrections table is empty and the confidence badges all say "baseline." Mitigation: seed it with admin-entered "verified by founder" entries on the 20 most-loaded rules so the UI doesn't look broken on day one.
- **G has telecom compliance.** SMS in the US requires a 10DLC campaign registration. Twilio handles the paperwork, but it adds ~1-2 weeks lead time. Mitigation: start the 10DLC application in week 4 so it's live by week 5.
- **PostHog adds an external dependency.** Mitigation: the analytics wrapper is no-op when the key is absent, so removal is one env var away.

---

## 6 · How to pick this up next session

1. Read this file.
2. Read `MEMORY.md`.
3. Pick the next un-shipped workstream from §4. Open its section here for the schema + acceptance criteria.
4. Branch: `git checkout -b workstream/<letter>-<short-name>`.
5. Migration first. RLS second. Code last. Tests with the code.
6. Verify: `pnpm type-check && pnpm test && pnpm lint && pnpm build`.
7. Manual e2e walkthrough documented in the PR description.
8. Update `MEMORY.md` with a session entry following the existing format.

The bar is the same one that got the prior consensus to 10/10: **no half-finished surfaces, no orphan columns, every new control wired through to real backend behavior with a real audit trail.**
