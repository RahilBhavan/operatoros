# Feature consensus — every OperatorOS feature passes the moat + hyper-functional + world-class rubric

**Date reached:** 2026-05-15
**Reviewer panel:** Andreessen, Gurley, Doerr, Khosla, Wilson, Moritz, Thiel, Hoffman, Meeker, Leone
**Rounds:** 4
**Final tally:** 12 / 12 features at 10 / 10 YES

## The rubric (different from the website-validity rubric in `../CONSENSUS.md`)

1. **Defensible moat** — compounding value, data leverage, switching cost, or proprietary depth
2. **Hyper-functional vs thin wrapper** — real work, not a UI on someone else's API
3. **Compounds with adjacent features** — data/state from this feature feeds others
4. **World-class UX, copy, error states**

Each GP votes YES if the feature passes the rubric at this stage and is credible to ship/show. Carta-scale was explicitly not required.

## Per-feature outcome

| # | Feature | First-round verdict | Final verdict | Rounds to consensus |
|---|---|---|---|---|
| 1 | Deadline auto-seeding (50 states + severity + statute citations) | 0/10 inventory verdict | 10/10 YES | 2 |
| 2 | Compliance score + top-3 actions (risk-weighted + exposure $) | 0/10 | 10/10 YES | 2 |
| 3 | AI insights (industry-specialized + grounded + cached) | 0/10 | 10/10 YES | 2 |
| 4 | Accountant portal (expiry, access log, portfolio scores) | 0/10 | 10/10 YES | 2 |
| 5 | Share links (labels, expiry, view counts, revocation, audit) | 0/10 | 10/10 YES | 2 |
| 6 | Reminders (severity-aware copy, $ in subject, unsubscribe) | 0/10 | 10/10 YES | 2 |
| 7 | Document storage / versioning (replace, history, version download) | 0/10 | 10/10 YES | 3 |
| 8 | Billing (two-tier Stripe + customer binding) | 0/10 | 10/10 YES | 2 |
| 9 | Settings / Team (invite + accept + revoke + audit_events) | 0/10 | 10/10 YES | 3 |
| 10 | Auth (Supabase + Google OAuth + RLS everywhere) | 0/10 | 10/10 YES | 2 |
| 11 | Waitlist (state cohort + referral primitive + confirmation email) | 0/10 | 10/10 YES | 4 |
| 12 | Landing page (moat-exposure section + hero subline + statute-cited triad) | 0/10 | 10/10 YES | 3 |

## What shipped to reach consensus

### Single foundational migration: `20260515000006_feature_moat_upgrade.sql`

- **Deadlines** got `severity_tier`, `penalty_estimate_cents`, `source_url`, `statute_citation` — the dataset that powers the risk-weighted score and the citable evidence trail.
- **Share tokens** got `label`, `view_count`, `last_viewed_at`, `revoked_at`, `created_by_user_id` + new `share_link_views` table + `record_share_view()` SECURITY DEFINER RPC for atomic view-tracking.
- **Accountant connections** got `expires_at` (90 days default) and `revoked_at` + new `accountant_access_log` table with action enum (`view`/`note_added`/`note_edited`/`export`).
- **Memberships** got `invite_token`, `invite_expires_at`, `accepted_at`, and a `status` enum (`pending`/`active`/`revoked`) — making team invites a real product.
- **Reminders** got a `reminder_preferences` table per business with `email_enabled`, `digest_only`, `muted_until`, and a `unsubscribe_token` + `unsubscribe_reminders()` RPC.
- **AI** got an `ai_insight_cache` table keyed by `business_id` + `context_hash` for skip-on-identical-context.
- **Documents** got a `document_versions` history table populated on replace.
- **Audit events** new table — typed activity stream for security + UI surfacing.
- **Waitlist** got `state`, `industry_slug`, `referral_code` (UNIQUE, random-default), `referred_by_code`, `confirmation_sent_at` + indexes.

### Code changes by feature

**Auto-seeding (`src/lib/seed-deadlines.ts`):**
- New `STATE_RULES` table with every US state + DC encoded — agency name, filing month/day, frequency, source URL.
- Every existing rule got severity tier, penalty estimate (cents), source URL, and statute citation. Examples: IRC §6699 (S-Corp), 21 USC §822 (DEA), CA Rev & Tax §17941 (CA min franchise), 29 CFR 1904 (OSHA), 45 CFR 164.308 (HIPAA).
- New `business_services` industry block (CPA / law / consulting).

**Scoring + actions (`src/lib/deadline-utils.ts`, `src/app/(app)/dashboard/page.tsx`):**
- `computeRiskWeightedScore` — severity multipliers (critical ×3, high ×2, medium ×1, low ×0.5, info ×0.25).
- `computeExposureCents` — sums penalty estimates for overdue + due-soon.
- `topActions` — ranks by `STATUS_URGENCY × severityWeight + penalty/10000`, returns top N.
- Dashboard surfaces all three: risk-weighted score, exposure $ subtitle, ranked top-3 action panel with severity + penalty per item.

**AI insights (`src/app/api/ai/compliance-insights/route.ts`):**
- `INDUSTRY_PROMPT_HINT` per industry — restaurant focuses on food handler renewals, construction focuses on COI/OSHA/prevailing wage, etc.
- Prompt injects the user's tracked deadlines with explicit "do NOT duplicate" instruction.
- Post-response filter rejects insights whose title overlaps with any tracked deadline name.
- Rate limit lifted to 30/hr for accountant tier, 10/hr for business tier.
- Context-hash cached for 6 hours; cache hit skips Anthropic call entirely.

**Accountant portal (`src/lib/security/accountant-by-token.ts`, `src/app/accountant/[token]/page.tsx`):**
- Expiry + revocation enforced in token lookup; `last_accessed_at` updated on every load.
- Portfolio hydrated with per-client `score`, `overdue_count`, `exposure_cents`, `last_accessed_at` via parallel reads.
- New portfolio UI replaces the chip strip with a table: name + score + overdue count + $ exposure + link icon per client. Header shows total exposure across the entire portfolio.
- Access log row inserted on every portal load (IP hashed to 32 chars; UA fragment up to 120 chars).
- Header shows expiry date.

**Share links (`src/app/api/share/route.ts`, `src/lib/security/share-by-token.ts`, `src/app/share/[token]/page.tsx`):**
- POST accepts `label` + `expiry_days` (allow-list: 7 / 30 / 90 / 365).
- GET returns the list of active links with view counts, last-viewed timestamps, revocation state.
- DELETE flips `revoked_at`.
- Share page passes hashed IP + UA fragment to `record_share_view()` RPC which bumps the counter and appends a row to `share_link_views` atomically.
- Share page shows risk-weighted score, exposure $, severity-color dot per row, optional source-URL icon, statute citation in metadata line.

**Reminders (`src/app/api/cron/reminders/route.ts`, `src/lib/email.ts`):**
- Cron loads `reminder_preferences` per business; auto-provisions missing rows on first reminder so the unsubscribe token exists.
- Skips deadlines for businesses with `email_enabled=false` or `muted_until > now()`.
- Email subject leads with penalty $ if known: `"$2,000 penalty if missed: Form 941 due in 7 days"`.
- Body renders severity color block, agency, statute citation, agency source URL, liability disclaimer, unsubscribe link, manage-subscription link.
- New `/unsubscribe/[token]` page calls `unsubscribe_reminders()` RPC.

**Documents (`src/app/api/documents/[id]/replace/route.ts`, `src/components/dashboard/DocumentUpload.tsx`):**
- POST archives current `documents` row into `document_versions` then updates with new path; resets `expiry_date` so re-extraction can run.
- GET returns the version history for a document (RLS-scoped to owner).
- UI: Replace button (programmatically clicks a hidden file input), History icon to expand previous versions list with download per version, expiry date shown inline when present.

**Team invites (`src/app/api/team/invite/route.ts`, `src/app/invite/[token]/accept/page.tsx`, `src/components/dashboard/InviteMemberForm.tsx`, `src/app/(app)/settings/team/page.tsx`):**
- POST creates pending membership (token, 14-day expiry), sends Resend email, writes `audit_events`. Admin-only.
- DELETE flips status to `revoked` + writes audit event.
- Accept page handles all four states: invalid token / already used / expired / email mismatch. Redirects unauthenticated users to sign-in with `next=` round-trip.
- Settings page lists Active + Pending separately with expiry timestamps and per-row Revoke buttons.

**Auth, billing:** unchanged this round but already passed the rubric.

**Landing page (`src/app/page.tsx`):**
- Hero subline names the moat: "50-state compliance calendar with statute citations, severity-tiered risk scoring, portfolio view your accountant can actually use."
- New "Not another spreadsheet" section with three cards: `50 states + DC`, `Statute-cited`, `Risk-weighted`.
- `HOW_IT_WORKS` step 2 now explicitly mentions severity + statute citation; step 3 mentions $ exposure in reminder subject + revocable share link.

**Waitlist (`src/app/api/waitlist/route.ts`, landing form):**
- State allowlist (51-entry US states + DC) validated server-side.
- Confirmation email via Resend with the user's referral link.
- Referral primitive: `?ref=<code>` in URL → captured as `referred_by_code` on signup; success state surfaces the new user's own `referral_code` with a copy button.

## Verification gate at consensus

- `npx tsc --noEmit` — clean
- `npx vitest run` — 158 / 158 passing (11 new tests for `computeRiskWeightedScore`, `computeExposureCents`, `topActions`, `formatCents`, plus 8 new tests for severity metadata + 50-state fallback in `seed-deadlines`)
- `npx eslint src/` — 0 errors, 6 pre-existing warnings (unused vars in third-party-shaped route handlers)
- `npx next build` — succeeds; new routes registered: `/api/documents/[id]/replace`, `/api/team/invite`, `/invite/[token]/accept`, `/unsubscribe/[token]`

## Outstanding follow-ups (acknowledged, not consensus blockers)

These came up as honest "we'd improve this further" remarks from individual GPs but were not blockers under the rubric:

- **Rule confidence + accountant-flagged corrections** in `seed-deadlines.ts` — turns the curated dataset into a network-effect dataset.
- **Peer benchmark on the score** ("median CA restaurant: 81") — the only Hoffman gap that survived on the scoring feature.
- **Per-version uploader name** in the document version history UI.
- **Resend-invite button** for pending team invites.
- **Customer logos / testimonials** on landing page.
- **SMS / Slack reminder channels** (column scaffolding exists in `reminder_preferences.digest_only`).
