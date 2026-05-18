# OperatorOS

> ⚠️ **HISTORICAL — do not rely on this.** Predates the 2026-05-15 VC consensus
> loop that collapsed pricing from 4 tiers to 2 (Business $79 / Accountant $299).
> For current facts see `README.md`.

**The Compliance Operating System for Small Business.**
The way QuickBooks owns accounting, OperatorOS owns regulatory life.

---

## Slide 1 — Cover

**OperatorOS**
AI-native compliance OS for the 1–50 employee business.
Distributed through the accountant.

Seed round · May 2026
Founder: Rahil Bhavan · rbhavanzim@gmail.com

---

## Slide 2 — The One-Liner

> *We auto-populate every regulatory deadline a small business owes the moment they sign up — federal, state, county, and industry-specific — then prove compliance on demand.*

47 deadlines. 0 spreadsheets. 1 score.

---

## Slide 3 — The Problem

**Small business compliance is run on memory and spreadsheets.**

- The median 1–50 employee business has **47 regulatory deadlines per year** (SBA).
- **80% track them in Excel, Google Calendar, or memory** — no systematic tooling.
- **53% have missed or near-missed a deadline in the last 24 months.**
- Average cost of a single missed deadline: **$14,200** (penalty + remediation + revenue lost).
- Estimated annual cost to US small business: **$127B**.

**The kicker:** every existing tool — Avalara, MyCorporation, LicenseLogix — asks the business owner to *already know what they need to track*. Which is the entire problem.

---

## Slide 4 — Why Now

Three curves crossed in 2025–2026:

1. **Regulatory surface area exploded.** State-by-state divergence on franchise tax, paid leave, AI disclosure, beneficial-ownership reporting (FinCEN BOI) means a Delaware LLC operating in 4 states now has obligations no human can hold in their head.
2. **LLMs can reason over jurisdiction-specific code.** Claude can read 50 state codes, an industry NAICS profile, and a payroll threshold *in one prompt* and tell you what you owe. That capability is 24 months old. Nobody has shipped it for SMB yet.
3. **Accountants are leaving the Big 4 in record numbers** and starting fractional CFO / bookkeeping practices. Each one needs a portfolio tool. None of them have one priced under $1,000/month.

The window: 18–24 months before an incumbent (Gusto, Rippling, QuickBooks) bolts on a worse version.

---

## Slide 5 — The Wedge

**Auto-discovery, not data entry.**

Sign up. Tell us four things: industry (NAICS), state, entity type, employee count.
By the time the onboarding flow finishes, your calendar is *already populated* with:

- IRS Form 941 quarterly cadence (if you have W-2 employees)
- State franchise tax / annual report (varies by jurisdiction)
- OSHA 300A posting window (if NAICS triggers it)
- Industry-specific licenses (cosmetology, food handler, contractor, DEA, CDL, etc.)
- County and city renewals where we have data
- FinCEN BOI deadline if the entity was formed after the threshold

The competitive moat begins on day 1 because we did the work the buyer cannot do for themselves.

---

## Slide 6 — The Product

A working application, today, in this repo (`/src/app/`):

| Surface | What it does |
|---|---|
| **Onboarding** | Seeds jurisdiction-aware deadlines from 4 inputs |
| **Dashboard** | Compliance score (0–100), upcoming + overdue list, document attachment per deadline |
| **AI Insights** (Claude) | Surfaces obligations the user didn't tell us about — payroll-threshold-triggered filings, multi-state nexus, license CE renewals |
| **Accountant Portal** | Magic-link access for a CPA to see *every* client's score, deadlines, and document status in one view — no login friction |
| **Share Links** | Read-only public URL for auditors, GCs, insurance carriers — proof of compliance in 1 click |
| **Reminders** | Resend-powered email cadence at T-30 / T-7 / T-1 / overdue, via a daily Vercel cron |
| **Billing** | Stripe four-tier (Starter $29 / Growth $79 / Scale $149 / Accountant Pro $499) |

**Built. Tested. Deployable.** Tech stack: Next.js 16 (App Router), Supabase Postgres with RLS, Anthropic Claude, Stripe, Resend, Vercel. Security baseline shipped (RLS-enforced multi-tenant, CSP, Stripe customer binding, RLS-protected storage, anon role revoked from sensitive routes).

---

## Slide 7 — How It Works

```
        ┌─────────────────────┐
        │  Sign up (4 inputs) │
        └──────────┬──────────┘
                   ▼
   ┌──────────────────────────────┐
   │ Auto-seed jurisdiction rules │  ◄── compliance data layer
   └──────────┬───────────────────┘
              ▼
   ┌──────────────────────────────┐
   │ Calendar + score + documents │
   └──────────┬───────────────────┘
       ┌──────┴──────┬──────────────┬─────────────────┐
       ▼             ▼              ▼                 ▼
   Reminders     AI Insights    Audit Export    Accountant Portal
   (Resend)      (Claude)       (PDF + share)   (1 → N clients)
```

The compliance score is the load-bearing primitive. It penalizes overdue items heavily (−20 each), rewards proven-compliant items (+10), and collapses to near-zero when things actually go wrong — the way real risk works.

---

## Slide 8 — The Distribution Insight (this is the whole company)

**One accountant manages 40–200 small business clients.**

A SaaS sale to a single SMB costs $300–$800 in CAC. A SaaS sale to a single *accountant* who then onboards their book costs the same $300–$800 — and yields **40+ paying customers**.

The Accountant Pro tier ($499/mo) is priced to be **trivially profitable for the accountant** (one client paying $79/mo Growth covers ~16% of the seat cost; the rest is pure leverage) and is the only place in the market where a CPA can get a real portfolio compliance view at sub-$1,000.

**This is not "we'll do channel sales later."** The product is *built* around the accountant: magic-link portal, white-label, bulk onboarding, portfolio scoring. It's the only feature surface no competitor has shipped.

Effective CAC per end-customer at scale: **$15–$40**. Effective LTV at Growth-tier ARPU and 3% monthly churn: **$2,400+**.

---

## Slide 9 — Business Model & Unit Economics

| Tier | Price | Target | What they get |
|---|---|---|---|
| Starter | $29/mo | Solo, sub-10 employee | 50 deadlines, 1 user |
| **Growth** | $79/mo | **The core SMB ICP** | Unlimited, 3 users, accountant view |
| Scale | $149/mo | 20–50 employee, multi-state | Unlimited, 10 users, **AI insights** |
| **Accountant Pro** | **$499/mo** | **The wedge** | Unlimited clients, white-label, bulk onboarding |

**Blended ARPU target (Y2):** $96/mo per end-business.
**Gross margin:** 82% (Supabase + Claude tokens + Stripe fees are the only variable costs; Claude usage capped to Scale tier).
**Payback period via accountant channel:** <2 months.

---

## Slide 10 — Market

**Bottom-up:**
- 6.0M US employer firms with 1–50 employees (Census BDS)
- 800K active CPAs + ~400K bookkeepers (BLS)
- Target penetration Y5: 1.5% of SMB ($96 ARPU) = **$104M ARR**
- Accountant Pro Y5: 8K firms × $499 = **$48M ARR**
- **Total Y5 ARR target: $150M+**

**Top-down:**
- US SMB compliance spend (penalties + tooling + accountant time): conservatively $40B
- We are the SaaS layer that re-allocates a sliver of the penalty pool to prevention

---

## Slide 11 — Competition

| | OperatorOS | Avalara | LicenseLogix | Gusto / Rippling | Excel |
|---|:-:|:-:|:-:|:-:|:-:|
| Auto-discovers deadlines | ✓ | — | partial | — | — |
| Cross-vertical (not just tax) | ✓ | sales tax only | license only | payroll only | ✓ |
| Accountant portfolio view | ✓ | — | — | — | — |
| AI-surfaced obligations | ✓ | — | — | — | — |
| < $100/mo entry | ✓ | — | — | ✓ | ✓ |

Nobody is in the box. The closest analog — **Carta for cap tables** — built a $7B company by being the obvious system of record for a thing 100% of customers were tracking in Excel. Same shape of opportunity, larger market.

---

## Slide 12 — Moat

Compounding, in this order:

1. **Compliance data layer.** Every jurisdiction × industry × entity-type rule we encode is leveraged across every customer in that segment. Marginal value of customer N+1 increases — classic data network effect on the supply side.
2. **Accountant lock-in.** A CPA who manages 80 clients in OperatorOS does not migrate. The portal is the daily workspace.
3. **Audit trail of compliance.** Every share link, every score history, every document-deadline link becomes evidence. Switching = forfeiting your record.
4. **AI feedback loop.** Every "missed obligation Claude caught" gets logged and feeds the rules layer. Each customer makes the next customer's seed better.

---

## Slide 13 — Traction & State

**Honest:** Pre-launch. End of build phase.

- ✅ Full product shipped to working state — onboarding, dashboard, deadlines, documents, AI insights, accountant portal, share, billing, reminders
- ✅ Security baseline complete (RLS, CSP, Stripe binding, storage hardening, SAST/dep CI)
- ✅ Four-tier pricing live in Stripe
- ⏳ Next 60 days: legal copy + Vercel WAF + public launch via 5 design-partner accountants

Why we're raising before logos: the build is done; the wedge is the accountant channel; the channel needs a small initial spend to ignite.

---

## Slide 14 — Roadmap (next 18 months)

| Quarter | Milestone |
|---|---|
| Q2 2026 | Public launch · 5 design-partner accountants · 200 end-customers |
| Q3 2026 | $50K MRR · expand jurisdiction coverage to all 50 states for top 12 NAICS |
| Q4 2026 | Accountant Pro v2 — bulk document collection, e-signature, white-label |
| Q1 2027 | API + webhooks for accountant practice-management integrations (Karbon, Canopy) |
| Q2 2027 | $250K MRR · Series A |

---

## Slide 15 — Team

**Founder / CEO:** Rahil Bhavan — building OperatorOS solo through MVP.
**Hiring with seed:** 1 senior full-stack, 1 compliance-data lead (ex-RIA / ex-CPA-tech), 1 GTM lead with accountant-channel rolodex.

---

## Slide 16 — The Ask

**Raising a $2M seed at $10M post.**

Use of funds (18 months of runway):
- 50% Engineering (3 hires) — jurisdiction coverage + accountant portal v2
- 25% Compliance data — content team + state-by-state rule curation
- 15% GTM — accountant-channel design partners, content marketing to CPAs
- 10% Infra + legal + reserve

**The investor we want:** a16z, specifically the SMB/vertical-SaaS thesis (Levchin/Casado lineage of "boring software for a $100B problem"). The Carta + Gusto + Toast pattern: a system of record for an under-tooled SMB function, distributed through the gatekeeper professional.

---

## Slide 17 — Why This Wins

> The most valuable SMB software companies of the last decade — Gusto, Toast, ServiceTitan, Carta — all share a pattern: **become the system of record for an obligation the SMB legally cannot ignore, and distribute through the trusted professional already in the room.**

Compliance is the largest under-tooled SMB obligation left. The accountant is already in the room.

**OperatorOS is the system of record.**
