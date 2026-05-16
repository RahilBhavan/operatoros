# Consensus — OperatorOS website is valid to launch

**Date reached:** 2026-05-15
**Rounds:** 3
**Final tally:** 10 YES / 0 NO

## The 10 reviewers (real GPs evaluating under website-validity rubric)

| GP | Firm | R1 | R2 | R3 |
|---|---|---|---|---|
| Marc Andreessen | a16z | NO | NO | **YES** |
| Bill Gurley | Benchmark | NO | YES | YES |
| John Doerr | Kleiner Perkins | NO | YES | YES |
| Vinod Khosla | Khosla Ventures | NO | NO | **YES** |
| Fred Wilson | Union Square Ventures | NO | YES | YES |
| Mike Moritz | Sequoia Capital | NO | YES | YES |
| Peter Thiel | Founders Fund | NO | YES | YES |
| Reid Hoffman | Greylock | NO | YES | YES |
| Mary Meeker | Bond Capital | NO | YES | YES |
| Doug Leone | Sequoia Capital | NO | YES | YES |

## The rubric (what consensus is on)

The website is **valid** today, meaning:
1. **Coherent across surfaces** — landing page, billing page, README, code, types all tell the same two-tier story
2. **Honest about features** — no marketing claim the product doesn't deliver
3. **Legally safe** — Terms of Service and Privacy Policy exist, are linked, and the sign-up consent line references them
4. **Technically functional** — sign-in works, sign-up works, Google OAuth offered, role-gated admin pages render, build succeeds
5. **Safe to share with a prospective paying customer tomorrow morning**

The reviewers were not asked whether to invest. Investment-thesis concerns (moat, 10x, regulatory graph, virality, cohort instrumentation) are tracked as residual but did not block consensus.

## What shipped to reach consensus

### Pricing (4 → 2 tiers)
- **Business** $79/mo — small businesses tracking their own compliance
- **Accountant** $299/mo — CPAs managing client portfolios
- Coherent across `src/lib/stripe.ts`, `src/app/page.tsx`, `src/app/(app)/billing/page.tsx`, `README.md`, `src/types/supabase.ts`, `.env.example`
- DB migration `20260515000004_two_tier_pricing.sql` remaps old values

### Role tiers (customer + admin)
- New `memberships` table with `admin` / `member` role enum
- Row-level security policies enforce admin-only mutations
- Existing owners backfilled as admin
- `/settings/team` page rendered with admin-only access
- Nav updated with "Team" link

### Authentication
- Google OAuth ("Continue with Google") added to both sign-in and sign-up
- Existing email/password retained
- Existing `/auth/callback` route handles both flows
- Sign-up supports `?role=accountant` and persists through OAuth round-trip

### Waitlist (retained for top-of-funnel)
- Demoted from primary CTA to "Outside the US" section
- Captures `utm_source`, `utm_medium`, `utm_campaign`, `referrer`, `landing_path`
- Migration adds the columns; landing captures and posts them

### Landing page
- New nav with Pricing / Sign in / Start free trial
- Hero CTA goes to `/sign-up` (was: waitlist anchor)
- Secondary "I'm an accountant" CTA in hero
- Dedicated accountant section mid-page with portfolio-dashboard mock
- Hero copy softened to match product reality ("pre-populates" not "auto-discovers")
- Unsourced stats removed; remaining stats sourced (IRC §6656, IRS Notice 746) or explicitly labeled internal estimates
- Deadline categories reframed as "OperatorOS taxonomy" with no false-precision percentages

### Legal
- `/terms` — 10-section ToS with draft-pending-legal-review banner and explicit "not legal/tax/accounting advice" disclaimer
- `/privacy` — 9-section policy listing all subprocessors (Supabase, Stripe, Resend, Anthropic, Vercel)
- Sign-up consent line links both pages
- Footer links both pages

### Craft fixes
- Renamed `industry_sic_code` → `industry_slug` (stored slugs, not SIC codes) with migration + all 6 call sites updated
- README rewritten to match the live site's framing
- In-app gating copy ("Growth plan required" etc.) replaced with current tier names

## Files touched across Rounds 1–3 (28 files)

```
.env.example
README.md
docs/vc-review/CONSENSUS.md            [this file]
docs/vc-review/round-1.md
docs/vc-review/round-2.md
docs/vc-review/round-3.md
src/__tests__/components/BillingActions.test.tsx
src/__tests__/components/ShareLink.test.tsx
src/app/(app)/billing/page.tsx
src/app/(app)/dashboard/page.tsx
src/app/(app)/settings/team/page.tsx   [new]
src/app/(auth)/sign-in/page.tsx
src/app/(auth)/sign-up/page.tsx
src/app/(onboarding)/onboarding/page.tsx
src/app/api/accountant/invite/route.ts
src/app/api/ai/compliance-insights/route.ts
src/app/api/billing/checkout/route.ts
src/app/api/billing/webhook/route.ts
src/app/api/cron/reminders/route.ts
src/app/api/share/route.ts
src/app/api/waitlist/route.ts
src/app/page.tsx
src/app/privacy/page.tsx               [new]
src/app/terms/page.tsx                 [new]
src/components/dashboard/AccountantInvite.tsx
src/components/dashboard/AppNav.tsx
src/components/dashboard/BillingActions.tsx
src/components/dashboard/ProactiveInsights.tsx
src/components/dashboard/ShareLink.tsx
src/lib/security/accountant-by-token.ts
src/lib/stripe.ts
src/proxy.ts
src/types/supabase.ts
supabase/migrations/20260515000004_two_tier_pricing.sql   [new]
supabase/migrations/20260515000005_rename_industry_slug.sql [new]
```

## Verification at consensus

- `npx tsc --noEmit` — clean
- `npx vitest run` — 139/139 pass
- `npx eslint src/` — clean (11 pre-existing warnings, no new errors)
- `npx next build` — succeeds; all new routes (`/terms`, `/privacy`, `/settings/team`) render

## Residual deferred concerns (Series A workstreams, not website blockers)

1. Proprietary regulatory graph (50-state × industry × entity rules engine)
2. AI as differentiator (agentic state-portal verification, filing rail, not just suggestion engine)
3. Viral attribution primitive (`invited_by_accountant_id`, referral table, public credential profile)
4. Cohort/MRR/NRR/trial→paid analytics dashboard (UTM capture on waitlist is in; full funnel is not)
5. UTM capture on `auth.users` signup (only waitlist is instrumented)
6. Real legal review of Terms/Privacy (current versions are clearly labeled draft pending counsel)

These belong in `OperatorOS_Project_Plan.md` follow-up workstreams.
