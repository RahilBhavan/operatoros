# VC Consensus Review — Round 2

**Date:** 2026-05-15
**Rubric (tightened from Round 1):** Is the website **valid** today — coherent across surfaces, honest about features, legally safe, technically functional, safe to send a prospective customer to tomorrow morning? Investment-thesis concerns (moat, 10x, TAM) are explicitly *out of scope* this round and tracked only as residual.

## Tally

**8 YES · 2 NO**

| # | Reviewer | Round 1 | Round 2 |
|---|---|---|---|
| 1 | Marc Andreessen | NO | **NO** |
| 2 | Bill Gurley | NO | YES |
| 3 | John Doerr | NO | YES |
| 4 | Vinod Khosla | NO | **NO** |
| 5 | Fred Wilson | NO | YES |
| 6 | Mike Moritz | NO | YES |
| 7 | Peter Thiel | NO | YES |
| 8 | Reid Hoffman | NO | YES |
| 9 | Mary Meeker | NO | YES |
| 10 | Doug Leone | NO | YES |

8 of 10 flipped to YES. Andreessen and Khosla holding NO.

## Intersection of remaining blockers

Both Andreessen and Khosla concur on the same root cause: **the README is the public face of the project on GitHub and it still tells the old, dishonest story**.

### Blocker R2-A: README L32 names dead tiers
> `README.md:32` — *"Stripe — Subscription billing (Starter / Growth / Scale)"* — three tiers that no longer exist. Cited by Andreessen, Khosla, Moritz (nit). One-line fix.

### Blocker R2-B: README L5/L13–14 still claims "auto-populates on signup"
> `README.md:5` — *"OperatorOS auto-populates a business's regulatory obligation calendar on signup"*
> `README.md:13–14` — *"Auto-populated compliance calendar on signup. Most tools require you to manually enter what you need to track. OperatorOS uses your industry, state, entity type, and employee count to pre-populate your calendar..."*
> The hero on the live site was softened to "pre-populates the typical deadlines." The README still has the old strong claim. Cited by Andreessen, Khosla.

### Blocker R2-C: In-app dashboard components reference deleted tiers
> `src/components/dashboard/ShareLink.tsx:49` — *"Shareable link — Growth plan required"*
> `src/components/dashboard/ProactiveInsights.tsx:77–80` — *"Growth or Scale plan required... Growth ($79/mo) and Scale ($149/mo)"*
> `src/components/dashboard/AccountantInvite.tsx:25,33` — *"Growth+"* badge, *"Upgrade to Growth"* link.
> A customer who signs up and hits the dashboard sees gating copy that contradicts the marketing site. Cited by Andreessen.

### Blocker R2-D: $14,200 citation imprecise
> `src/app/page.tsx:63` cites *"IRS Notice 746 / failure-to-deposit penalty schedule"* for the $14,200 figure, but Notice 746 publishes the per-form penalty *rates*, not an average dollar figure. Cited by Khosla. Either rephrase as a calculated illustration with the math shown, or replace with a sourced figure.

### Nit R2-E (Leone non-blocker, fix while here)
> `src/app/privacy/page.tsx:149` links to `/docs/security/threat-models.md` — that path doesn't resolve from a Next.js route. Fix: link to GitHub or remove.

## Residual investment-thesis concerns (acknowledged, not blocking)

- Andreessen: still no proprietary regulatory graph, AI still a thin wrapper, $79 floor signals lifestyle SaaS. Deferred.
- Khosla: AI surface unchanged; no agentic system over state agency sources. Deferred.
- Gurley: no MRR/NRR/cohort dashboard, no UTM on `auth.users` signup. Deferred.
- Thiel: viral-attribution primitives still missing. Deferred.
- Hoffman: no `invited_by_accountant_id` / referral table. Deferred.
- Doerr: no event instrumentation for activation funnel. Deferred.
- Meeker: no PostHog SDK, no UTM on auth signups. Deferred.

These are real Series A concerns and stay tracked in `OperatorOS_Project_Plan.md` follow-ups. They do not block the *website-validity* rubric.

## Round 2 verdicts (full text)

### 1. Marc Andreessen — a16z (Round 2): **NO**
> Three remaining website-validity blockers: (1) In-app surfaces still sell the dead tiers — ShareLink, ProactiveInsights, AccountantInvite reference Growth/Scale. (2) README L32 names old Stripe tiers. (3) README L5 still leads with the "auto-populates on signup" overclaim that was softened on the landing. Fix those three and I flip to YES.

### 2. Bill Gurley — Benchmark (Round 2): **YES**
> Pricing now coherent across stripe.ts, page.tsx, billing/page.tsx, README plans table, types. Accountant kept as separate channel SKU. OAuth ships, legal pages exist and are linked, accountant wedge is primary, stats sourced or relabeled. Residual unit-economics concerns deferred.

### 3. John Doerr — Kleiner Perkins (Round 2): **YES**
> Hero copy matches reality. OAuth ships on both auth surfaces. Role tier is real (memberships table + RLS + admin-gated team UI). Pricing coherent. Synthetic-stat footnote gone. Legal pages exist. UTM capture on waitlist is the right foundation. Residual measurement concerns deferred.

### 4. Vinod Khosla — Khosla Ventures (Round 2): **NO**
> Three residual blockers: (1) README L3 "AI-native compliance OS" + L5 + L13–14 still carry the auto-discovery overclaim — public face on GitHub still tells the old story. (2) README L32 lists Stripe Starter/Growth/Scale — wrong tiers. (3) "$14,200" cites IRS Notice 746 but Notice 746 is the rate schedule, not a source for an average. Fix those three and YES.

### 5. Fred Wilson — USV (Round 2): **YES**
> All three Round 1 flags landed. 60-second test passes. Voting YES.

### 6. Mike Moritz — Sequoia (Round 2): **YES** (one residual nit, not a blocker)
> All four Round 1 flags addressed. One nit: `README.md:32` still names old tiers — two-line fix; doesn't change vote. Site is coherent, honest, legal-pages-linked, OAuth works, schema matches reality.

### 7. Peter Thiel — Founders Fund (Round 2): **YES**
> Accountant SKU promoted to peer. Cross-surface coherence holds. Legal pages linked. Auto-discovers softened. Residual monopoly/secret concerns deferred.

### 8. Reid Hoffman — Greylock (Round 2): **YES**
> Accountant pathway is now a first-class signable surface. Residual virality concerns deferred.

### 9. Mary Meeker — Bond Capital (Round 2): **YES**
> Four specific integrity violations from Round 1 are gone. Headline stats sourced or correctly framed. UTM capture wired end-to-end. Residual: no PostHog/Mixpanel SDK, no auth-signup UTM. Deferred.

### 10. Doug Leone — Sequoia (Round 2): **YES**
> All three P0 blockers cleared — legal pages real and linked, pricing coherent, OAuth + role tiers shipped. Non-blocker: privacy page links to a `/docs/` markdown file that won't resolve. Fix before next round so it doesn't become a Round 3 gotcha.

## Round 3 fix list

1. Rewrite `README.md` lines 1–35 (Why-we-win section + tech stack) to match the live site's softer framing and the two-tier Stripe story. Keep §2 "Accountant-first distribution" (it's still accurate). Keep §3 "AI compliance intelligence" but rewrite to describe what the product *actually does* (Claude-Haiku surfacing follow-ups on the existing calendar), not auto-discovery.
2. Update `src/components/dashboard/ShareLink.tsx:49`, `ProactiveInsights.tsx:77–80`, `AccountantInvite.tsx:25,33` to remove old tier names. Use "paid plan required" or "upgrade to enable" with a link to `/billing`.
3. Rephrase the $14,200 stat in `src/app/page.tsx`. Two options: (a) show the math ("$2,400 failure-to-deposit + $X interest + $Y CP-notice processing over 6 months"); (b) replace with a different verifiable figure. Going with (a) — clearer for SMB readers.
4. Fix `src/app/privacy/page.tsx:149` — either link to GitHub or remove the link.

Then re-poll Andreessen + Khosla (and a sanity spot-check on Moritz for the README nit).
