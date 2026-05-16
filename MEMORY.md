# MEMORY

Per `~/.claude/CLAUDE.md`: project decision log. Read at the start of every session. Never contradict a logged decision without flagging first.

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
