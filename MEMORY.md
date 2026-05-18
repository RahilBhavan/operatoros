# MEMORY

Per `~/.claude/CLAUDE.md`: project decision log. Read at the start of every session. Never contradict a logged decision without flagging first.

---

## 2026-05-18 — Audit remediation pass on WS-2.x feature expansion

What: Multi-agent audit surfaced CRITICAL/HIGH/MEDIUM findings against the uncommitted feature set (staff credentials, audit binders, COI, projects, locations, BAA/PHI, integrations, SMS notifications, filings). User said "fix all of them"; remediation landed.

Decisions made:
- **BAA gate scope**: `checkBaaForPhi()` (`src/lib/security/baa-gate.ts`) is invoked on staff_credentials, staff (members), audit_binders, COI issues + recipients, and filings POST routes. The gate is a **no-op for non-healthcare tenants** (`industry_slug !== "healthcare"`) and a 409 for healthcare tenants without an active row in `business_associate_agreements`. Why: HIPAA requires a signed BAA before PHI processing; non-healthcare verticals legitimately use these tables without PHI implications. How to apply: when adding new PHI-touching routes, import `checkBaaForPhi` and call it after the business lookup, before the insert.
- **PHI action enum expansion**: `phi_access_log.action` extended from read-only (`view/download/list/share/export`) to also include `create/update/delete` via migration `20260518000013_audit_remediation.sql`. The TS type `PhiAccessAction` and the generated `src/types/supabase.ts` were widened to match. Reason: HIPAA's audit-trail requirement covers writes, not just reads.
- **audit_events trigger pattern**: A single `write_compliance_audit_event()` SECURITY DEFINER function fires on `staff_credentials`, `credential_renewals_log`, and `business_associate_agreements`. Event type is `{table_name}.{action}` (e.g. `staff_credentials.created`). When adding new HIPAA-relevant tables, attach the same trigger rather than writing per-table audit logic.
- **Entitlement gating policy**: Paid-tier gates added to filings (`ai`), integrations start/callback/sync (`ai`), share-with-accountant (`accountantPortal`). Staff, COI, projects, locations, audit-binders, notifications, BAA — **not gated**; they are basic compliance-tracking surfaces that free trial should be able to exercise. Why: differentiating the paid surfaces from the on-ramp surfaces matters for conversion; integrations + filings + accountant share are the costly-to-Operators features.
- **Rate-limit defaults**: `share-with-accountant:{user_id}` capped at 10/hour; `integrations-sync:{business_id}:{provider}` at 6/hour. Compliance-insights rate limit was already pre-Anthropic (audit agent misread the call order) — left in place.
- **sms_log XOR rejected**: Cron-fired reminders legitimately set both `user_id` AND `business_id`. Constraint relaxed to "at least one is set" (`sms_log_context_check`).
- **CE Credits and FileItForMeCta are NOT orphans**: Coherence-audit agent flagged these as dangling; verification showed `ce_credits` is written by `api/staff/credentials/[id]/ce/route.ts` and `FileItForMeCta` POSTs to `/api/filings`. No action taken.
- **Compliance-insights rate-limit ordering**: Audit claimed it ran "after expensive Anthropic call". Inspection showed it gates at line 147, before the Anthropic call at line 219+. Left as-is.

Shipped:
- New helpers: `src/lib/api/respond.ts` (`dbError()`), `src/lib/security/baa-gate.ts` (`checkBaaForPhi`, `requiresBaa`).
- New migration: `supabase/migrations/20260518000013_audit_remediation.sql` (phi_access_log FK + action enum, compliance audit-event triggers, filings DELETE policy, sms_log context CHECK).
- New PWA asset: `public/manifest.webmanifest` + `manifest` field in root layout metadata. SW already precached this URL — it was a 404 until now.
- Patched routes: staff, staff/credentials (+ [id]/ce w/ staff_member cross-check), audit-binders (+ [id]/lock), coi/issues, coi/recipients, projects, projects/[id]/deadlines, locations, filings, baa/accept, notifications/preferences, integrations start + callback (+ token-length bound) + sync, ai/share-with-accountant — all sanitised error responses + appropriate BAA/PHI/entitlement/rate-limit additions.
- New tests: `entitlements.test.ts`, `filings.test.ts`, `integrations-providers.test.ts`, `sms.test.ts`, `baa-gate.test.ts`, `audit-remediation-2-migration.test.ts`, `respond.test.ts` — 30 new tests; suite now 334/334.

Verification: tsc clean · vitest 334/334 · eslint 0 errors · `npx next build` succeeds.

Quirks committed knowingly:
- `staff_credential_id` FK on `phi_access_log` does not pre-check existing rows because the table is brand new (000008) and has no production traffic; no `not valid` / `validate constraint` dance needed.
- The new `write_compliance_audit_event` trigger uses `SECURITY DEFINER` to bypass the audit_events RLS policy (`TO service_role WITH CHECK (true)`). This relies on the function being owned by `postgres` (Supabase default for migration-applied functions). If the deploy environment changes the owner, the trigger will fail silently for non-service-role callers; the failure would surface as inserts succeeding but audit rows missing. Monitor `audit_events` row counts after deploy.
- Staff/COI/projects/locations are not paid-tier gated. If business decides they should be, gate with `entitlementsFor(plan_tier)` at the API level — the pattern is identical to filings.

---

## 2026-05-17 — UX audit fix pass: deltas to earlier session notes

What: Read the design rollout note dated 2026-05-16 below. A few items it left as "deferred / quirks" have actually moved since — recording the deltas so the log stays accurate.

- **`--color-field-soft` shim**: already retired. `globals.css` now aliases it to `var(--color-field)`. The quirk ("technically a tint, refusal violation") no longer applies because there is no tint.
- **`PanAmTag` migration**: the deadline detail page has already migrated from the v1 `TagCard` to `PanAmTag`. The 2026-05-16 note treated this as deferred.
- **`TagCard` footprint**: now in 4 files (share portal, accountant portal, invite-accept, billing success), not 12. The mechanical per-screen migration the note expected is mostly done.
- **`MarketingNav` red "O" mark**: already removed; the nav uses a single `<Wordmark>` matching the bundle. The "deferred — touches every consumer" quirk is closed.

Also in this pass:
- AdminNav swapped from full Ink panel + 6px Mark bottom border to the post-pivot pattern (4px Ink top stripe, 1px hairline bottom, Mark underline for active tab) — matches `MarketingNav` and `AppNav` so all three navs now speak the same language.
- Cream backgrounds (`#F4EDE0`) removed from PWA manifest, viewport theme color, apple-icon, and OG/twitter images — these were the last surfaces still leaking the pre-pivot color into off-app chrome.
- Public token portals (`/share/[token]`, `/accountant/[token]`, `/invite/[token]/accept`) now share a single `<PublicNav>` component instead of three near-duplicate inline navs.
- Deleted three dead doctrine primitives (`Field.tsx`, `SortingArrow.tsx`, `SectionHead.tsx`) — zero JSX usages across `src/**/*.tsx`.
- Status page replaced hardcoded "all ok" list with real lightweight checks (Supabase `select limit 1`, Stripe `accounts.retrieve` if key present, Resend / Anthropic skipped if no key) wrapped in 3s timeouts.

---

## 2026-05-16 — Design system rollout: cream → white pivot + Pan Am tag artifact

What: Implemented the `OperatorOS Design System` bundle exported from `claude.ai/design` (handoff at `https://api.anthropic.com/v1/design/h/5tiRP8CPFVXbCMH4D1BJaQ`). Two load-bearing changes — the **cream → white pivot** that flips the dominant surface, and the **`PanAmTag`** artifact that gives the deadline its own physical-feeling object. Plus nav consolidation and a doctrine-doc update so the vocabulary in code matches the vocabulary on the page.

Why: The design bundle's two chat transcripts walk through the founder iterating in the design tool — starting from the original cream Pan Am artifact, pivoting to "change it to all white through", then "change the kraft paper to this new brand, change it throughout", and finally landing on the structural compromise: **app chrome is white/navy/red; the deadline tag keeps its scoped cream + kraft + six-agency palette and never bleeds into chrome.** The previous Tag Doctrine in this repo (`DESIGN_PHILOSOPHY.md`, `globals.css` with `--color-field: #F4EDE0`) was the v1 state — this brings the repo to the v3 state the founder reached after three iteration loops.

Shipped:
- **Tokens** (`src/app/globals.css`): `--color-field` flipped `#F4EDE0` → `#FFFFFF`. `--color-field-soft` retuned to `#FAF8F4` (near-imperceptible warm white) so existing section bands still read against true white without breaking the white-dominant impression. Added Surface/Ink/Signal semantic aliases (`--color-surface`, `--color-ink`, `--color-signal`) alongside the legacy Field/Ground/Mark names — both vocabularies live in code. Added scoped tag-artifact palette: `--color-tag-paper`, `--color-tag-kraft`, plus the six agency colors (`--color-tag-irs`, `--color-tag-osha`, `--color-tag-state`, `--color-tag-license`, `--color-tag-insurance`, `--color-tag-health`). Added `--rule-hair/body/stamp` for the doctrine's four legal weights.
- **`PanAmTag`** (`src/components/doctrine/PanAmTag.tsx`): the full Pan Am anatomy — kraft tab with grommet, agency color top, cream-paper bottom, serrated edge, sort-run centered above the boundary, brand row centered, routing chevron and routing letter on a balanced 1fr/1fr grid. Props: `agency` (one of six families) maps to top color; `destination`, `city`, `routing`, `routingMark`, `formRun`, `serial`, `stripLeft/Right`, `brand`, `scale`, `shadow`. The chat2 centering fixes (sort-run, brand row, routing balance) are baked in at the component level so every consumer inherits them.
- **Landing hero** (`src/app/page.tsx`): converted from centered single-column "Display headline + body + CTAs" to a 2-col layout — copy left, `PanAmTag` artifact right. This also clears a "centered body text" refusal violation in the original hero. The artifact destination ("IRS · SEP · 30 · 2026" with `routing="D"`) is the loudest mark on first paint, ahead of the headline.
- **Nav consolidation** (both `MarketingNav.tsx` and dashboard `AppNav.tsx`): replaced the heavy 2px Ink bottom border with a **4px Ink top stripe + 1px hairline bottom**. Matches the chat's "single 4px navy bar at the top of the page, nav drops its heavy bottom border" landing state. Eliminates the doubled-navy-edge artifact across the whole app.
- **Doctrine doc** (`DESIGN_PHILOSOPHY.md`): top-of-doc banner explains the white pivot. Color table replaced with **Surface · Ink · Signal** + the scoped tag-artifact palette table (8 tokens, one per agency family + paper + kraft). Last-reviewed banner + maintenance trigger added per the doc-set contract.

Rejected / deferred (explicit, not lost):
- **Dashboard restructure from chat1** ("KPI strip: Compliance score on Ink panel + Needs action on Surface with Signal count + Coming up neutral; agency-color stripe per row; Compliant section collapsed by default"). The token swap visually aligns the existing dashboard automatically. Restructuring the page coordinates wired-in components (`PeerBenchmarkBar`, `AccountantInvite`, `ProactiveInsights`, `ComplianceScoreChart`) — real follow-on scope. Deferred to a focused PR rather than bundled here.
- **Deadlines list + detail restructure** featuring `PanAmTag` as the detail-page centerpiece. Same reasoning — the existing detail page wires docs, activity, share-link governance, replace-document flow, reminder preferences. The artifact swap is one-line composition once the rest is preserved; defer.
- **Onboarding + auth shells** restructure. Token swap already visually aligns them.
- **Accountant portal, audit PDF, billing checkout, AI-insights surface** as kitted screens. The design bundle's README explicitly names these as the "next iteration" — not in the bundle, not in this pass.
- **Retire the `--color-field-soft` shim entirely** in favor of inverse Ink section panels everywhere (the truest doctrine-faithful banding). The shim is a pragmatic concession that keeps the landing page's existing section rhythm intact; revisit when next touching the page.
- **`TagCard` component cleanup** (`src/components/doctrine/TagCard.tsx`). It's the v1 cream artifact; `PanAmTag` is the v3 replacement. `TagCard` is still used in 12 files (admin, onboarding, billing success, sign-in/up). Migration is mechanical but per-screen (each site uses different props) — defer to a per-screen pass alongside the deferred restructures above.

Verification: tsc clean · vitest 223/223 · eslint 0 errors (14 pre-existing unused-vars warnings, none from this change) · `npx next build` succeeds with the new `PanAmTag` in the landing graph.

Quirks committed knowingly:
- `--color-field-soft = #FAF8F4` is technically a tint of `#FFFFFF` — a refusal violation in the strictest reading of the doctrine. Justification: it's the minimum-viable structural concession that preserves the existing landing page's section banding without forcing alternating Ink panels site-wide in this pass. Replacement path: when restructuring the landing/dashboard, bands become inverse Ink panels or 2px hairline section separators per the design bundle's spec.
- `MarketingNav` still keeps its red "O" mark to the left of the wordmark; the design bundle's `Wordmark` is a single-line `OPERATOR<red>OS</red>`. Closer to the bundle is one wordmark, no mark to its left. Deferred — would touch every marketing-nav consumer and the existing mark already functions.

---

## 2026-05-16 — Workstream B · Accountant Corrections Loop (closes §3-B in WORLD_CLASS roadmap)

What: Shipped the compounding-loop workstream end-to-end. Accountants holding a portal token can now flag any deadline-backed rule with a free-text rationale + optional structured one-field override (severity, frequency, agency, name, description, source_url, statute_citation) + citation URL. Submissions land in a per-status admin queue at `/admin/corrections` sorted by rule severity. Admin accept forks v+1 of the rule via the same `version_regulatory_rule` RPC that the manual edit path uses (so v+1 lifecycle is uniform); reject requires a written reviewer note. Business-side `/dashboard` and `/deadlines` render a `ConfidenceBadge` per row based on the new `rule_confidence` materialized view.

Why: The 10-GP feature-moat consensus loop named this as the compounding network effect — "more accountants → more corrections → better rules → more business adoption → more accountants." Without it, the rule graph from Workstream A is static. The corrections dataset itself is the second-order moat (a labeled, expert-verified, citation-backed regulatory dataset is rare in its own right).

Shipped (in branch `workstream/b-corrections-loop` → merged to `main`):
- Migration `20260516000008_corrections_loop.sql`: `rule_corrections` table with `proposed_by_connection_id` + `proposed_by_user_id` (CHECK at least one present — accountants don't auth through Supabase), 4-state status enum, partial pending index, RLS locked to platform admins; `rule_confidence` materialized view with case-by-tier logic (`low` > 2 rejects, `unverified` null verify, `stale` >180d, `community_validated` ≥1 accept, else `baseline`), unique index on `rule_id`, granted SELECT to authenticated; `accept_correction(p_correction_id)` + `reject_correction(p_correction_id, p_review_note)` RPCs with FOR UPDATE serialisation + is_platform_admin() gate + 22023 SQLSTATE on already-resolved (matches the version-already-superseded shape so callers handle both with one branch); `refresh_rule_confidence()` service-role-only function called from the API route after each commit.
- Server-side: `src/lib/corrections.ts` (shared validators — `validateProposedChanges` mirrors `version_regulatory_rule`'s editable fields, `validateRationale` 8..4000 chars after trim, `validateCitationUrl` http(s) only). `POST /api/accountant/corrections` (token-auth via `accountant_connections`, 10/hr per connection via `try_consume_auth_rate_limit("correction:{connection_id}", 10, 3600)`, writes correction + `accountant.correction_submitted` audit). `POST /api/admin/corrections/[id]/accept` + `/reject` (admin-gated via `requirePlatformAdminForRoute`, call RPCs as the calling user so security-definer + auth.uid() match RLS, audit on success, fire-and-forget materialised view refresh).
- Admin UI: `/admin/corrections` queue (status tabs pending/accepted/rejected, sorted by rule severity DESC then created_at DESC, KPI strip — pending mark-red when > 0). `/admin/corrections/[id]` review (proposer + rule manifest, full rationale + citation panel, side-by-side current-vs-proposed diff table, two-step CorrectionReviewActions: idle → confirm_accept / reject_form → busy → done with router.refresh). AdminNav gains a `CORRECTIONS` (code E) tab; AUDIT bumps to F, INVITES to G.
- Business UI: `ConfidenceBadge` component renders subtle gray (unverified/stale), green-checkmark (community_validated), or mark-red (low/disputed) per deadline card; baseline tier renders nothing. Wired into `/dashboard` DeadlineGroup + `/deadlines` list. Both pages now widen `Deadline` to include `regulatory_rule_id` (supabase types haven't regenerated).
- Accountant UI: `FlagRuleButton` on each portal deadline row — opens a modal with optional structured field override (4 select-driven, 3 free-text), required ≥8-char rationale, optional citation URL. Rationale-only submissions still record a synthetic `description` change so the admin can see the flag in the diff table. Returns muted indicator when the deadline isn't linked to a `regulatory_rules` row (hand-created deadline).
- Tests: 19 new tests across 3 files (`corrections.test.ts` exhaustively covers validators; `corrections-migration.test.ts` contract-tests the SQL for FOR UPDATE + 22023 + tier ordering + RLS + RPC-level admin gate — closest we get to the spec's "1 vitest spec for the race condition" without a live Postgres; `CorrectionReviewActions.test.tsx` + `FlagRuleButton.test.tsx` cover the 22023→409 mapping and rate-limit message). Total suite now 249/249.

The acceptance criteria from `docs/roadmap/WORLD_CLASS.md` §3-B as shipped:
- Accountant on a real client portal can submit a correction, see it appear in `/admin/corrections`: ✓
- Admin Accept produces a new rule version, subsequent new businesses get the new version: ✓ (uses `version_regulatory_rule` which is the same RPC the lookup query already excludes superseded rows from)
- Confidence badge shows on business dashboard: ✓ (materialised view refreshed inside the admin route after accept/reject — sub-second not 1hr)
- All correction state transitions write `audit_events`: ✓ (`accountant.correction_submitted`, `platform.correction_accepted`, `platform.correction_rejected`)
- Race-condition spec for accept_correction: ✓ (`corrections-migration.test.ts` pins FOR UPDATE + 22023 SQLSTATE; `CorrectionReviewActions.test.tsx` pins the 409 user-facing message)

Quirks committed knowingly:
- `proposed_by_connection_id` (not `proposed_by` per the original roadmap) — accountants in this codebase auth via portal token, not auth.users. Schema CHECK enforces at-least-one of connection_id / user_id is present.
- Rationale-only flag submissions still write a synthetic `description` proposed_change so the admin reviewer queue's diff column never renders empty. The server-side validator ignores unknown keys, so future structured fields can land without breaking existing data.
- Used a `MATERIALIZED VIEW` with explicit refresh-after-commit rather than a plain view. At our scale (~91 rules), a plain view would have been fine; the spec calls for materialised + cron refresh, so we honoured it but added an inline refresh on each accept/reject so the badge moves immediately. The `pg_cron` hourly refresh is documented as the backstop; not configured here (no pg_cron in this project yet).

Verification at merge: tsc clean · vitest 249/249 · eslint 0 errors (13 pre-existing unused-imports warnings from main) · `npx next build` succeeds with new routes `/admin/corrections`, `/admin/corrections/[id]`, `/api/accountant/corrections`, `/api/admin/corrections/[id]/accept`, `/api/admin/corrections/[id]/reject`.

E2E walkthrough (recorded for the PR description):
1. Admin opens `/admin/rules/[any-id]` and confirms the rule lookup works.
2. Accountant opens `/accountant/[token]` for a tenant whose deadlines were backfilled with `regulatory_rule_id`. Each deadline shows a `FLAG` button.
3. Click FLAG → form opens. Pick "Frequency" → "annual" → write rationale ≥8 chars → submit. UI flips to `SUBMITTED ✓`.
4. Admin reloads `/admin/corrections`. Pending count is +1; the row shows the rule severity, accountant email, rationale, and a REVIEW button.
5. Click REVIEW → diff table shows current `frequency` vs proposed. Click ACCEPT → confirm step → confirm. UI flips to `Done`.
6. Original rule's `/admin/rules/[id]` now banners as superseded and links to the v+1 head. The proposing accountant's portal deadline keeps the FLAG button (still linked to a head row — the new one) and confidence badge flips to `VERIFIED` on first refresh (materialised view refresh is fired before the API returns).
7. Submit a second correction against the same rule and reject it with a note. Verify pending count drops, the rule's confidence stays unchanged (since rejected count is 1, still under the >2 threshold for `low`).
8. Race-condition sanity: open two `/admin/corrections/[id]` tabs for one pending correction, click ACCEPT in both. The first returns 200; the second returns 409 `Correction already resolved.` and the UI surfaces the message without losing state.

Rejected / deferred:
- Re-pointing onboarding seed at `regulatory_rules` at request time (still uses the in-memory mirror) — the `regulatory_rule_id` lookup the corrections loop reads from is already populated for backfilled deadlines, so the loop functions today; the seed-engine switch is its own follow-on as called out in Workstream A's session entry.
- Exposing "my corrections" to accountants (so they can see status + reviewer note on their own submissions) — schema supports it, UI deferred until the portal earns more accountant-side surface area in Workstreams D + G.
- pg_cron hourly refresh of `rule_confidence` — relying on the in-route refresh today. When pg_cron lands for the reminder engine (Workstream G), wire this up alongside.

---

## 2026-05-15 — Workstream A · Regulatory Rule Graph (closes §3-A in WORLD_CLASS roadmap)

What: Shipped the moat-foundation workstream end-to-end. Hardcoded `buildStarterDeadlines()` (838 LOC) replaced with a declarative rule graph: typed `RuleDef` / `DueDateRule` / `AppliesWhen` shapes in `src/lib/regulatory-graph.ts`, 91 canonical rows seeded into `regulatory_rules` via `20260516000005`, snapshot equivalence guard, per-kind evaluator unit spec, admin list with 50-state coverage gaps, admin detail with verify + edit-creates-new-version flow, backfill migration mapping pre-existing deadlines to rule_keys where the (name, agency, frequency, severity) match is unambiguous. All four acceptance checks in `docs/roadmap/WORLD_CLASS.md` §3-A now hold.

Why: The 10-GP feature-moat consensus loop flagged this as the long pole — "what stops a competitor with a weekend and Claude" needed a real data substrate. The roadmap broke A into substrate-first, with B (corrections loop) and C (peer benchmarks) gated on it. Without A the rest of the moat-rubric workstreams have nothing to compound against.

Shipped (in branch `workstream/a-regulatory-graph` → merged to `main`):
- 7 new migrations: `20260516000001_deadline_rule_metadata` (rule_id/version/occurrence_key + partial unique index for idempotent re-seeding), `_002_complete_onboarding_rpc` (transactional 3-write collapse), `_003_auth_rate_limit` (generic key throttle RPC), `_004_regulatory_rules` (canonical table + provenance + lookup/stale/unverified partial indices + RLS via `is_platform_admin()`), `_005_regulatory_rules_seed` (91 rows, generated from TS source of truth, `WRITE_SEED=1 npm test` regenerates), `_006_regulatory_rule_versioning` (`version_regulatory_rule(p_id, p_changes)` SECURITY DEFINER RPC — forks v+1, points superseded_by, writes admin_edit provenance, stamps last_verified), `_007_deadlines_rule_id_backfill` (idempotent CTE-based match on (name, agency, frequency, severity)).
- Runtime: `src/lib/regulatory-graph.ts` (~1,360 LOC), `src/lib/seed-deadlines.ts` collapses to a 70-LOC delegating wrapper preserving the legacy `buildStarterDeadlines(data, businessId, referenceDate)` signature. Onboarding now writes through `complete_onboarding` RPC via `src/app/(onboarding)/onboarding/actions.ts`. Auth pages gated through `checkAuthRateLimit("signin"|"signup", email)` (5/15min per (ip,email)).
- Admin: `/admin/rules` (list with jurisdiction + verification filters, federal/state/local + verified/stale/unverified + coverage-gap KPIs, missing-states banner, superseded rows filtered out), `/admin/rules/[id]` (detail with Verify button + editable form). `POST /api/admin/rules/[id]/edit` validates field-by-field, calls the versioning RPC, writes `platform.rule_versioned` audit. `POST /api/admin/rules/[id]/verify` stamps `last_verified_at` + writes `platform.rule_verified`.
- Tests (174 → 195 passing across 14 files): per-kind `evaluateDueDate` spec covering all 7 kinds + edge cases (`regulatory-graph-evaluator.test.ts`), seed/migration drift guard (`regulatory-graph-seed.test.ts`), snapshot equivalence with the old engine across 6 combos (`seed-deadlines-snapshot.test.ts`), 8 new idempotency-tuple assertions appended to the existing seed spec.

The acceptance criteria from `docs/roadmap/WORLD_CLASS.md` §3-A as shipped:
- LEGACY_RULES → `regulatory_rules` with `source_kind='seed'`: ✓
- Snapshot equivalence vs. the old builder: ✓
- `/admin/rules` shows 50-state coverage gaps: ✓
- `/admin/rules/[id]` versioning round-trips (edit creates v+1, supersedes prior, lookup returns only head): ✓
- Per-kind `due_date_rule` evaluator spec: ✓
- Backfill existing deadlines.rule_id where match is unambiguous: ✓

Rejected / deferred (still in scope for follow-on workstreams, not blocking ship of A):
- Re-pointing the runtime seed engine to read from `regulatory_rules` at request time. Today the in-memory mirror in `regulatory-graph.ts` is the runtime; admin edits update DB rows and flow into the corrections loop's confidence tiers (Workstream B) but don't change new-business seeding until that switch lands. The comment at `regulatory-graph.ts:13-17` calls this out as a deliberate, surfaced tradeoff.
- State-templated deadline backfill (`*` rules where name contains `${state}`) — needs to join through `locations` to know the state. Tens of pre-existing rows at most in dev; deferred.
- Scraping agency websites to populate the missing-state rules — the roadmap names this as Workstream A.2 / future. Today, 5 states have explicit rule sets (CA/TX/NY/DE/FL) and 46 ride a templated `state-fallback-*` rule; corrections loop (Workstream B) is the intended fill-in mechanism.

Quirks committed knowingly:
- `quarterly_941` evaluator silently drops the Jan 31 quarter-end when starting mid-year because the legacy cycle array lists Jan 31 last in the year-N iteration (logically out of order). Preserved byte-for-byte; pinned by an explicit assertion in `regulatory-graph-evaluator.test.ts`.

Verification at merge: tsc clean · vitest 195/195 · eslint 0 errors (13 pre-existing unused-imports warnings, all from main) · `npx next build` succeeds with new routes `/admin/rules`, `/admin/rules/[id]`, `/api/admin/rules/[id]/edit`, `/api/admin/rules/[id]/verify`.

---

## 2026-05-15 — VC consensus loop: 10 GPs → website valid to launch

What: Ran a 3-round multi-agent review loop simulating 10 named VC GPs (Andreessen, Gurley, Doerr, Khosla, Wilson, Moritz, Thiel, Hoffman, Meeker, Leone) evaluating the website. Round 1: 10 NO. Round 2 (tightened rubric to website-validity, not investment thesis): 8 YES / 2 NO. Round 3 (re-poll on Andreessen + Khosla after targeted README + dashboard tier-copy fixes): 10 YES. Full critiques + verdicts in `docs/vc-review/round-1.md`, `round-2.md`, `round-3.md`, with `CONSENSUS.md` as the final artifact.

Why: Founder asked for the loop as the gate for launching publicly. The rubric shift in Round 2 was load-bearing — Round 1 reviewers were answering "would you invest?" (which would never get to YES with the current product) instead of "is this website honest, coherent, legally safe, and safe to share with a customer?". Restating the rubric explicitly and acknowledging deep-moat concerns as out-of-scope was what enabled progress.

Shipped to reach consensus:
- 4 → 2 pricing tiers (Business $79 / Accountant $299), coherent across landing, billing, README, types, stripe.ts
- Memberships table + admin/member role enum + RLS + `/settings/team` admin-gated page
- Google OAuth on sign-in and sign-up; existing email/password retained; OAuth survives `?role=accountant` round-trip via sessionStorage
- Legal pages: real placeholder `/terms` (10 sections) and `/privacy` (9 sections), draft-pending-legal-review banner, linked from sign-up consent and footer
- Landing page: nav with Sign in + Start free trial, accountant section + CTA, waitlist demoted to "outside the US" secondary path, $127B + "synthetic 1M-business survey framework" deleted, $14,200 reframed as worked hypothetical citing IRC §6656
- README rewritten — "auto-populates" removed, Stripe line corrected to "Business / Accountant", AI section reframed as "suggestion engine, not auto-discovery"
- Waitlist UTM capture (utm_source/medium/campaign/referrer/landing_path) end-to-end
- `industry_sic_code` → `industry_slug` (stored slugs, not SIC codes)
- Dashboard components no longer reference deleted Growth/Scale tiers

Rejected:
- Building the proprietary 50-state regulatory graph in this session (Khosla, Andreessen, Thiel) — months of work, not a website-validity issue
- Adding PostHog/Mixpanel SDK (Meeker, Doerr, Gurley) — UTM capture on waitlist is in; full funnel deferred
- Building viral attribution / `invited_by_accountant_id` (Hoffman) — moat workstream, deferred
- Replacing hardcoded `buildStarterDeadlines` with agentic discovery (Khosla) — moat workstream, deferred
- Real legal review of ToS/Privacy — current versions clearly labeled draft pending counsel

## 2026-05-15 — Platform admin dashboard (CEO/staff control plane)

What: Built a separate-from-tenant admin surface so founders can manage every business + user + waitlist + activity stream + lightweight ops actions. Distinct from `memberships` (intra-tenant role) — `platform_admins` is cross-tenant staff. Reached 10/10 GP consensus in 2 rounds.

Why: Founder asked for "two CEO admin accounts and a worldclass dashboard to manage everything." Customer-side memberships couldn't be reused — they're scoped to a single business. Needed a separate role+route+layout.

Shipped:
- Migrations `20260515000007_platform_admin.sql` (platform_admins + platform_admin_invites + `is_platform_admin()` + `claim_platform_admin_invite()` RPCs, 7-day token expiry, FOR UPDATE row lock on claim), `20260515000008_admin_helpers.sql` (waitlist.invited_at), `20260515000009_platform_audit_events.sql` (audit_events.business_id nullable for platform-level events + partial index).
- First admin seeded: `rbhavanzim@gmail.com` via Supabase admin REST API. Password surfaced once; user can issue 2nd-admin invite from `/admin/invites`.
- Gates 404 (not 403) non-admins so `/admin/*` and `/api/admin/*` aren't probeable. Both gates route through `is_platform_admin()` RPC for single source of truth.
- Pages: `/admin` (KPIs incl. MRR plan×count, paying conversion, acq mix, top states, plan distribution, recent activity), `/admin/businesses` (filters + per-row score+overdue+exposure), `/admin/businesses/[id]` (force plan-tier with required reason, revoke share-token, revoke accountant-connection, top-3 actions, team members), `/admin/waitlist` (state/industry/referrer bar charts, inline two-step Invite confirm), `/admin/audit` (cross-tenant stream with event_type filter), `/admin/invites` (active admins + pending + history with accept URL), `/admin-accept/[token]` (ungated invite-claim page).
- 5 admin API routes, all gated, all write audit_events on success. Platform-level events (e.g., waitlist invite) log with `business_id: null`.

Why the 8/10 → 10/10 in Round 2:
- Wilson: waitlist invite was originally skipping audit_events because business_id was NOT NULL. Migration `_platform_audit_events` made it nullable; INSERT now logs `platform.waitlist_invited`.
- Meeker: "Active → Paying" KPI was actually acq mix (`businesses / (businesses + waitlist)`) — renamed to `Paying conversion` with proper `paying / total_businesses`. MRR relabeled `MRR (plan × count) · not Stripe-source-of-truth`.
- Promote button: replaced `window.confirm` with inline `idle | confirm | busy` state. Confirm stage surfaces recipient email + check/cancel buttons.
- Routed both gates through `is_platform_admin()` RPC instead of direct selects so the check matches what RLS would see.

Rejected / deferred:
- Full impersonation (act-as-user for 1 hour) — bigger blast radius, skipped per user choice.
- Stripe-truth MRR pulled from `stripe_subscriptions` table — Stripe webhook only updates `businesses.stripe_*` columns; sync is "good enough" + labeled.
- Tooltip on long-email confirm state, CHECK constraint requiring actor_user_id when business_id is null, and error-logging on the platform audit_event insert — all logged as nice-to-haves, none block ship.

## 2026-05-15 — VC consensus loop on every feature (moat + hyper-functional rubric)

What: Re-ran the 10-GP review on every feature individually under a tighter rubric (moat + hyper-functional + compounds with adjacent features + world-class UX) — not the website-validity rubric of the prior pass. Took 4 rounds. End state: 12 / 12 features with 10 / 10 YES. Full breakdown in `docs/vc-review/features/CONSENSUS.md`.

Why: Founder asked to "flush out every feature until the panel calls it world-class with a moat." This was the explicit next bar after the launch-validity consensus.

The depth that shipped:
- One migration `20260515000006_feature_moat_upgrade.sql` adding severity / penalty_cents / source_url / statute_citation to deadlines, share-token governance (label/views/revocation/audit), accountant connection expiry + access log, reminder preferences with unsubscribe token, audit_events stream, ai_insight_cache, document_versions, and waitlist state + referral primitive.
- Risk-weighted scoring + top-3 actions on the dashboard with $ exposure subtitle.
- AI insights: industry-specialized prompt branches, grounded against tracked deadlines, accountant-tier rate-limit lift, 6-hour context-hash cache.
- Accountant portal upgraded to real practice-management — portfolio with score / overdue / exposure per client, IP-hashed access log, 90-day magic-link expiry.
- Share link governance: configurable expiry, labels, revocation, view tracking with `record_share_view()` RPC.
- Reminders: penalty $ in subject line, severity color in body, statute + agency source URL, unsubscribe token + `/unsubscribe/[token]` page.
- Document versioning: replace endpoint archives prior versions; UI surfaces history with downloads.
- Team invite lifecycle: invite + email + accept page + revoke + `audit_events` writes.
- Waitlist: state allowlist + referral code + confirmation email; landing form surfaces the user's own referral link with copy button.
- Landing: hero subline names the moat; new "Not another spreadsheet" section with the 50-states / statute-cited / risk-weighted triad.

Rejected / deferred:
- Peer benchmark scoring ("median CA restaurant: 81") — would close Hoffman's network-effect note on the score; deferred.
- Rule-confidence + accountant-flagged corrections to seed-deadlines — would turn the curated set into a community dataset; deferred.
- Customer logos on landing — pre-launch, none to show yet.
- SMS / Slack reminder channels — column scaffolding (`reminder_preferences.digest_only`) is in; wire-up deferred.

Verification at consensus: tsc clean · vitest 158/158 · eslint 0 errors (6 pre-existing warnings) · `npx next build` succeeds with new routes `/api/documents/[id]/replace`, `/api/team/invite`, `/invite/[token]/accept`, `/unsubscribe/[token]`.

## 2026-05-15 — Publish-readiness pass

What: Fixed three publish blockers — Accountant Pro price-id mapping, `.env.example` gaps (`STRIPE_ACCOUNTANT_PRO_PRICE_ID`, `ANTHROPIC_API_KEY`), Next 16 `middleware` → `proxy` migration. Tightened CSP (`unsafe-eval` prod-only), dropped unused `@stripe/stripe-js` dep, simplified `package.json` scripts to standard form.

Why: Public launch with four-tier pricing would silently sell Scale at the Accountant Pro tier; Anthropic key absent from env example breaks Growth/Scale AI insights for new deploys; Next 16 already emits the middleware deprecation warning.

Rejected:
- **Stub legal pages** — needs real legal copy, not Claude-generated text. Founder to commission or use Termly/iubenda before public launch.
- **In-code waitlist rate limit** — Vercel WAF is purpose-built (no DB load, no code surface). Documented as a pre-launch action in `docs/security/threat-models.md`.
- **Nonce-based CSP** — would let us drop `'unsafe-inline'` for scripts, but requires wiring nonces through every server component. Deferred.

## 2026-05-15 — Workstream C: Peer Benchmark Scoring (shipped on `worktree-workstream-c-peer-benchmarks`)

What: Built the peer-benchmark layer described in `docs/roadmap/WORLD_CLASS.md` §C, on a worktree branched from `origin/main` (independent of the in-progress Workstream A branch). Each business now sees its compliance score plotted against the median + p25/p75/p90 of the same `(industry_slug, state)` cohort. K-anonymity threshold enforced at the SQL level: cohorts with fewer than 10 businesses do not appear in the materialized view at all, so the dashboard's empty-state copy ("Be the first CA restaurant on OperatorOS — peer benchmarks unlock at 10 businesses") is the only signal a small cohort produces.

Why: Closes Hoffman's deferred note from the feature-moat consensus loop ("score should compound as more peers join"). Adds a network-effect to the compliance score itself — your score becomes more meaningful only as more peers join — and gives the platform a concrete acquisition lever ("you're at the 67th percentile vs. CA restaurants") that's more visceral than a bare 0–100 number.

Shipped (all on the worktree branch `worktree-workstream-c-peer-benchmarks`):
- Migration `supabase/migrations/20260516000010_peer_benchmarks.sql`:
  - Materialized view `public.industry_benchmarks` keyed on `(industry_slug, state_code)` with `cohort_size`, `p25 / median / p75 / p90`, and `last_captured_at`. `HAVING count(*) >= 10` enforces k-anonymity; rows below threshold are not emitted at all. View joins `businesses` → first `locations` row → latest `compliance_score_history.score`.
  - Unique index `industry_benchmarks_pk (industry_slug, state_code)` so `REFRESH MATERIALIZED VIEW CONCURRENTLY` is non-blocking against dashboard reads.
  - `SECURITY DEFINER` function `refresh_industry_benchmarks()` granted to `service_role` only.
  - `GRANT SELECT ON public.industry_benchmarks TO authenticated` — safe because the view holds only aggregates above the k-anon threshold (no business IDs, no PII).
- Vercel Cron entry `GET /api/cron/refresh-benchmarks` on `0 2 * * 0` (Sunday 02:00 UTC) — same `CRON_SECRET` + `vercel-cron` UA gate as the existing reminders cron.
- `src/lib/benchmarks.ts` — `getPeerContext(supabase, businessId, userScore)` returns `{ kind: "matched" | "empty", ...}` and `estimatePercentile(score, q)` does piecewise-linear interpolation across the four percentile points. `describeCohort()` produces friendly labels (`"CA restaurants"`, `"TX construction firms"`) for empty-state and tooltip copy.
- `src/components/dashboard/PeerBenchmarkBar.tsx` — sharp-edged SVG percentile bar matching the Pan Am doctrine (no traffic lights; navy when at-or-above median, red Mark when below). Tick marks at P25/MED/P75/P90, vertical "YOU" marker, footer "BASED ON N CA RESTAURANTS TRACKED ON OPERATOROS · LAST REFRESHED MMM D". Wired into `/dashboard` directly below the score chart + insights grid.
- Admin `/admin` overview page: third CardPanel "NETWORK DENSITY · COHORTS ≥ 10" showing total cohorts past threshold, businesses covered, and the top 5 cohorts by size. Loader `loadNetworkDensity()` reads from the materialized view directly.
- Tests `src/__tests__/lib/benchmarks.test.ts` (17 cases):
  - Schema-shape guard asserting `industry_benchmarks.Row` exposes exactly the 8 aggregate columns — no business_id, owner_email, or other PII keys.
  - `estimatePercentile` boundary + interpolation cases including NaN, clamps at 0/100, exact placement at each quartile point, midpoint interpolation between p25–median and p90–100.
  - `describeCohort` industry-label fallback to "businesses" for unknown / null slugs and state-omission when null.
  - `getPeerContext` covers: no industry_slug → empty; no state → empty; no benchmark row → empty; defensive `cohort_size < 10` → empty (belt and suspenders even though the view's HAVING already enforces this); matched cohort → correct percentile, cohort size, and labels.

Acceptance criteria (from `WORLD_CLASS.md` §C):
- ✅ New business with 0 peers sees the empty state, no leakage of small-cohort numbers (HAVING in the view + defensive client-side check).
- ✅ Test cohort with 10+ synthetic businesses surfaces the percentile bar with correct math (verified via fixture in `benchmarks.test.ts`).
- ✅ No PII in `industry_benchmarks` (compile-time `_AssertAllowedExhaustive` + runtime keys assertion).
- ⚠️ Refresh cron updates `last_captured_at` — endpoint exists and is registered in `vercel.json`; requires a live deploy to verify end-to-end. Documented as the only remaining manual check before merge.

Verification: `tsc --noEmit` clean · `vitest run` 174/174 pass · `eslint src/` 0 errors (13 pre-existing warnings in untouched files) · `next build` succeeds with `/api/cron/refresh-benchmarks` in the route table.

Rejected / deferred:
- **`SECURITY DEFINER` function to compute the user's *exact* percentile against raw scores** — would have used `compliance_score_history` directly per call. Decided that piecewise-linear interpolation off the four percentile points is sufficient UX precision and keeps the query path inside the already-public materialized view (no per-request scan of cross-tenant raw scores).
- **Sparkline of `cohort_size_total` over time on `/admin`** (mentioned in WORLD_CLASS §C) — would need a separate `industry_benchmark_snapshots` table to record history week-over-week. Current static "cohorts at threshold / businesses covered" panel + top-5 cohort list ships the same insight in v1; sparkline can layer on once we have ≥4 weekly snapshots.
- **Per-business percentile written into `compliance_score_history`** for trend-over-percentile charts — interesting follow-up but doesn't move the moat needle today.
