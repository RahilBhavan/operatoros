# OperatorOS — Master Overview

> A single document covering what OperatorOS is, what it does, how it works, what it wants to become, who it competes with, and what it does not yet have.

---

## 1. The One-Paragraph Answer

**OperatorOS is the compliance operating system for the 1–50 employee business.** It auto-populates a small business's regulatory deadline calendar at signup — federal filings, state entity reports, payroll tax cadences, industry licenses, county and city renewals — then tracks compliance score, sends multi-channel reminders, stores documents against each deadline, and lets accountants manage their entire client portfolio from one place. It is sold direct to small businesses and through accountants, who manage 40–200 clients each. Long-term it wants to be the system of record for small-business regulatory life, the way QuickBooks is the system of record for accounting.

---

## 2. The Problem

Small business compliance is run on memory and spreadsheets.

| Data point | Source |
|---|---|
| Median regulatory deadlines per 1–50 employee business per year | **47** (SBA) |
| Small businesses tracking compliance in Excel, calendar reminders, or memory | **80%** |
| Small businesses that missed or near-missed a deadline in the last 24 months | **53%** |
| Average cost of one missed deadline | **$14,200** |
| Estimated annual cost to US small business of missed compliance | **$127B** |

**Why the problem persists:**

1. The regulatory surface area is enormous and grows every legislative session.
2. Every existing tool — Avalara, MyCorporation, LicenseLogix, Harbor Compliance — assumes the buyer *already knows what they need to track*. That is the actual problem.
3. The accountant who could absorb this work has no portfolio software priced for a 40-client book.
4. The cost of the failure (penalty, license suspension, closure, contract loss) is paid by the small business; the cost of the tooling is also paid by the small business. The incentives align — they just have nothing to buy.

---

## 3. What OperatorOS Is

A working web application — built on Next.js 16, Supabase, Anthropic Claude, Stripe, Resend, and Vercel — that delivers the following from a single signup:

### 3.1 Auto-Discovery (the wedge)
The buyer enters four things: **industry (NAICS), state, entity type, employee count**.
By the time the onboarding flow finishes, the calendar is *already populated* with the deadlines that apply — including IRS quarterly filings, state annual reports, OSHA posting windows, industry-specific licenses, and FinCEN beneficial-ownership reporting where applicable.

### 3.2 Compliance Score (the daily-active hook)
A 0–100 score weighted to reflect real risk:

| Status | Weight | Reasoning |
|---|---|---|
| Compliant (human-confirmed) | **+10** | Proven |
| Upcoming (tracked, unconfirmed) | **+5** | In the system |
| In progress (due within 30 days) | **0** | Attention required |
| Overdue | **−20** | Real failure — score collapses appropriately |

One overdue item on an otherwise clean calendar lands at ~70/100. Three overdue items approach 0. This matches the real economic shape of risk and is the reason customers will check the dashboard.

### 3.3 Document Storage Per Deadline
Every deadline can have files attached — licenses, COIs, filed forms, inspection results. Stored in Supabase Storage with RLS-enforced per-tenant isolation. Claude extracts expiry dates from uploaded documents and proposes deadline updates.

### 3.4 AI Insights (Claude)
On Growth/Scale tiers, Claude reads the business profile and active deadlines and surfaces obligations the user *did not tell us about*: payroll-threshold-triggered filings, multi-state nexus exposure, license CE renewal cadence, industry-specific quarterly returns. Every insight is sourced to the responsible agency and carries a verify-with-your-accountant disclosure.

### 3.5 Accountant Portal
Magic-link access — no login friction — into a single view of every client a CPA manages: each client's compliance score, upcoming deadlines, overdue items, document status, and a notes thread. This is the only surface in the market that gives a 40-client bookkeeper a portfolio compliance view at sub-$1,000/month.

### 3.6 Share Links
Time-limited, read-only public URLs an owner can send to an auditor, insurance carrier, GC, or franchisor — "here is proof of my compliance." One click; no account needed on the recipient side.

### 3.7 Reminders
Multi-stage email cadence at T-30 / T-7 / T-1 / overdue, dispatched daily by a Vercel cron through Resend. SMS and WhatsApp are roadmapped, not built.

### 3.8 Billing (live)
Four-tier Stripe pricing:

| Plan | Price | Deadlines | Users | Accountant features |
|---|---|---|---|---|
| Starter | $29/mo | 50 | 1 | — |
| Growth | $79/mo | Unlimited | 3 | Read-only invite |
| Scale | $149/mo | Unlimited | 10 | + AI insights |
| **Accountant Pro** | **$499/mo** | Unlimited | Unlimited | Full portfolio, white-label, bulk onboarding |

---

## 4. What It Does — Mapped to the Codebase

| Capability | Where it lives |
|---|---|
| Onboarding / deadline seeding | `src/app/(onboarding)/` |
| Dashboard + compliance score | `src/app/(app)/dashboard/`, `src/lib/deadline-utils.ts` |
| Deadlines CRUD + document attachment | `src/app/(app)/deadlines/`, `src/app/api/documents/` |
| AI insights | `src/app/api/ai/` |
| Accountant portfolio | `src/app/accountant/`, `src/app/api/accountant/` |
| Share/audit export | `src/app/share/[token]/`, `src/app/api/share/`, `src/app/api/export/` |
| Email reminders cron | `src/app/api/cron/` (Vercel daily job) |
| Stripe checkout + webhook | `src/app/(app)/billing/`, `src/app/api/billing/` |
| Waitlist | `src/app/api/waitlist/` |
| Multi-tenant security | `supabase/migrations/` — 15 migrations, RLS-enforced on every table |

---

## 5. How It Works — The Loop

```
  ┌─────────────────────────────┐
  │ Signup (NAICS, state,       │
  │ entity, employees)          │
  └──────────┬──────────────────┘
             ▼
  ┌─────────────────────────────┐
  │ Compliance data layer       │ ◄── jurisdiction × industry rules
  └──────────┬──────────────────┘
             ▼
  ┌─────────────────────────────┐
  │ Pre-populated calendar      │
  │ + score + document slots    │
  └──────────┬──────────────────┘
        ┌────┼────────┬─────────────┬────────────────┐
        ▼    ▼        ▼             ▼                ▼
   Reminders  AI    Audit export   Accountant     Stripe
   (Resend)  Insights (share link)  portal        billing
   daily cron (Claude)
```

The compliance data layer is the load-bearing component. Every jurisdiction × industry × entity-type rule we encode is leveraged across every customer in that segment — marginal value of customer N+1 increases.

---

## 6. What It Wants to Be

**Mission:** Make it impossible for a small business to be blindsided by a compliance failure.

**The single metric that matters:** Missed deadlines prevented per customer per year.

**Seven-year vision:** The operating system for small business regulatory life. Embedded in every accountant's workflow. The default place an auditor, GC, insurance carrier, or franchisor goes to verify that a small business is in good standing. The Carta-of-compliance — the obvious system of record for a thing 100% of customers are tracking, badly, in spreadsheets today.

**Stage gates on the way there:**

| Stage | What proves it |
|---|---|
| Wedge | 5 accountant design partners, 200 end-customers, <3% monthly churn |
| Vertical depth | One vertical (restaurants or contractors) referring organically; NPS > 50 |
| Channel ignition | 35% of new revenue via accountant portfolios; CAC payback < 2 months |
| Network effect | Subcontractors share credentials to GCs via OperatorOS share links; GCs ask "are you on OperatorOS?" |
| Data moat | 50K+ business profiles, 2M+ deadline events; benchmarking reports licensed to insurers and industry associations |
| Platform | API + integrations (Karbon, Canopy, QuickBooks, Gusto); enterprise tier; international (CA, UK) |

---

## 7. Who It's For

### Primary ICP — the end-customer
1–50 employee US business in a regulated vertical. Operates in 1–4 states. Has W-2 employees. Owner is the buyer; office manager is the primary user.

### High-priority verticals (where pain × willingness-to-pay is highest)
- **Restaurants and food service** — health inspections, food handler certs, liquor license. 62 deadlines/year on average — the highest.
- **Construction and trades** — contractor license, COI, OSHA crew certifications. The "triple threat" of lapsing credentials.
- **Healthcare and licensed professionals** — RN, CPA, DEA, state-board renewals + CE credits.
- **Personal services** — cosmetology, pesticide, fire safety inspections. The most underpowered segment; 68% track nothing.

### Channel ICP — the accountant
A CPA, bookkeeper, or fractional CFO managing 40–200 small business clients. Currently uses some combination of QuickBooks Online Accountant + spreadsheets + their head. Wants a portfolio compliance view; will pay $499/mo and re-bill it (or absorb it) across clients.

---

## 8. Distribution & Go-To-Market

**The accountant channel is the company.**

A SaaS sale to a single SMB costs $300–$800 in CAC. A SaaS sale to a single accountant who then onboards their book costs roughly the same — and yields 40+ paying end-customers. Effective CAC per end-customer at channel scale: **$15–$40**. LTV at Growth-tier ARPU and 3% monthly churn: **$2,400+**.

**Tactical sequence:**
1. **Phase 0 (now):** 5–10 design-partner accountants. White-glove onboarding. Goal: one says "I can't run my practice without this."
2. **Phase 1:** Content marketing to the CPA audience (newsletters, podcast sponsorships, AICPA channels). Product Hunt + SMB founder Twitter.
3. **Phase 2:** Vertical-specific direct: partner with a restaurant-focused accountant network or a construction insurance broker.
4. **Phase 3:** Reseller / white-label for franchise networks and PEOs.

**What we explicitly do not do:** Paid search competing for "compliance software." That bidding war is owned by Avalara and not winnable at our price point.

---

## 9. Business Model

**Pricing:** four tiers, listed above. Blended ARPU target at Y2: **~$96/mo** per end-business.

**Costs (variable):**
- Supabase (Postgres + Auth + Storage): ~$1–3/customer/mo at scale
- Anthropic Claude tokens (Scale tier only): capped at ~$2/customer/mo via prompt caching + tier gating
- Stripe fees: 2.9% + $0.30
- Resend: ~$0.10/customer/mo
- → **Target gross margin: 82%**

**LTV/CAC targets:**
- Direct: LTV/CAC 4×, payback 9 months
- Accountant channel: LTV/CAC 25×+, payback <2 months

---

## 10. Market

**Bottom-up (US only):**
- 6.0M US employer firms with 1–50 employees (Census BDS)
- 800K active CPAs + ~400K bookkeepers (BLS)
- 1.5% SMB penetration × $96 ARPU = $104M ARR (Y5)
- 8K Accountant Pro firms × $499 = $48M ARR (Y5)
- **Y5 ARR target: $150M+**

**Total addressable spend:**
- Penalty + remediation losses: $127B/yr (recoverable through prevention)
- SMB tooling spend on adjacent products (Gusto, QuickBooks, Avalara): $40B+
- We re-allocate a sliver of the penalty pool to prevention.

---

## 11. Competitors

| Competitor | What they actually do | Where they fall short |
|---|---|---|
| **Avalara** | Sales tax automation, some license filings | Sales-tax-only DNA; enterprise-priced; no auto-discovery of non-tax obligations |
| **LicenseLogix / Harbor Compliance** | Business license filing-as-a-service | Reactive (you tell them what you need); high per-filing pricing; no calendar/score/portal |
| **MyCorporation / ZenBusiness / Northwest** | Entity formation + registered agent; basic compliance reminders | Compliance is a bolt-on; no industry-specific obligations; no document storage |
| **Gusto / Rippling** | Payroll-driven HR/compliance | Payroll-adjacent only — they know your 941s, not your liquor license or your OSHA log |
| **QuickBooks Online + spreadsheets** | The actual incumbent | Everything manual; no auto-discovery; the problem we exist to solve |
| **Vanta / Drata** | SOC 2 / ISO 27001 compliance | Different problem entirely — IT security frameworks for tech companies, not regulatory deadlines for SMBs |
| **Compliancy Group, HIPAA One** | Vertical-specific (healthcare) compliance | Single-vertical; expensive; not built for a 5-person dental office |

### The capability comparison

|  | OperatorOS | Avalara | LicenseLogix | Gusto | QBO + Excel |
|---|:-:|:-:|:-:|:-:|:-:|
| Auto-discovers deadlines | ✓ | — | partial | — | — |
| Cross-vertical (tax + license + OSHA + industry) | ✓ | tax only | license only | payroll only | ✓ (manually) |
| Compliance score | ✓ | — | — | — | — |
| Document storage per deadline | ✓ | — | — | partial | — |
| Accountant portfolio view | ✓ | — | — | — | — |
| AI-surfaced obligations | ✓ | — | — | — | — |
| Audit share link | ✓ | — | — | — | — |
| Sub-$100/mo entry | ✓ | — | — | ✓ | ✓ |

Nobody is in the box. The closest analogs are **Carta** (system of record for cap tables — built a $7B company by replacing spreadsheets in a single SMB obligation) and **Toast** (vertical SMB SaaS distributed through the trusted operator in the room). Same shape of opportunity in a larger horizontal market.

---

## 12. Moat (in compounding order)

1. **Compliance data layer.** Every jurisdiction × industry × entity-type rule encoded is leveraged across every customer in that segment. Supply-side data network effect. Years of curation to replicate.
2. **Accountant lock-in.** A CPA managing 80 clients in OperatorOS does not migrate. The portal becomes their daily workspace.
3. **Audit trail of compliance.** Every share link, score history, and document-deadline link becomes evidence. Switching = forfeiting your record.
4. **AI feedback loop.** Every "missed obligation Claude caught" is logged and feeds the rules layer. Customer N+1's seed is sharper because of customers 1..N.
5. **Credential network (Phase 4).** Subcontractors share verified credentials to GCs via OperatorOS. GCs start preferring subs who can share an OperatorOS link over a PDF. Demand-side network effect — same flywheel that made DocuSign.

---

## 13. Where It Stands Today (May 2026)

**Build status: complete and deployable.**

- ✅ Onboarding seeds jurisdiction-aware deadlines
- ✅ Dashboard with compliance score
- ✅ Deadlines CRUD + document attachment
- ✅ AI insights (Claude) gated to Growth/Scale
- ✅ Accountant portfolio portal (magic-link)
- ✅ Audit share links + PDF export
- ✅ Daily reminder cron via Resend
- ✅ Stripe four-tier billing (Starter / Growth / Scale / Accountant Pro)
- ✅ Security baseline: RLS on every table, Stripe customer binding, hardened CSP, RLS-protected storage, anon role revoked from sensitive endpoints, SAST + dep-audit in CI

**Pre-launch blockers:**
- Legal copy (ToS, Privacy, liability disclaimers) — needs commissioned legal review, not LLM-generated text
- Vercel WAF for waitlist rate limiting
- Production Stripe price IDs wired to the four live tiers

**Traction:** Pre-launch. Zero paying customers. Honest framing.

---

## 14. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| **Compliance data is wrong** → customer relies on it and is fined | Every deadline carries a source link + disclosure to verify with accountant; Pro tier is positioned as accountant-supervised, not accountant-replacement |
| **An incumbent (Gusto, QBO) bolts on a worse version** | 18–24 month window; depth in non-payroll verticals (licenses, OSHA, COI) is moat; accountant portfolio view is something neither has shipped |
| **Accountants don't bite — channel theory fails** | Direct SMB acquisition is still a viable B-plan; pricing supports direct unit economics at LTV/CAC 4× |
| **AI hallucinates obligations and erodes trust** | Every AI surfaced obligation is grounded in a cited agency source; insights gated to higher tiers; output marked as "review required, not authoritative" |
| **Regulatory data goes stale** | Monitoring Agent (roadmapped) auto-scrapes 50 state SoS + top 500 county portals; human review for requirement changes; auto-update for date changes |
| **Sales cycle is too long for a $79 product** | Onboarding < 30 min is the answer; self-serve checkout; accountant channel amortizes the sales motion |

---

## 15. Roadmap

| Window | Milestone |
|---|---|
| Q2 2026 | Public launch · legal review · 5 accountant design partners · 200 end-customers |
| Q3 2026 | $50K MRR · 50-state coverage for top 12 NAICS · mobile-responsive polish |
| Q4 2026 | Accountant Pro v2: bulk document collection, e-signature, white-label · SMS reminders |
| Q1 2027 | API + integrations (Karbon, Canopy practice-management) · regulatory change Monitoring Agent v2 |
| Q2 2027 | $250K MRR · Series A · multi-location dashboard |
| H2 2027 | Credential network for construction · Canada expansion |
| 2028 | Compliance benchmarking data products licensed to insurers + associations |

---

## 16. Team

- **Founder / CEO:** Rahil Bhavan — building solo through MVP
- **Planned seed hires:** senior full-stack engineer, compliance-data lead (ex-CPA-tech or ex-RIA), GTM lead with accountant-channel rolodex

---

## 17. The Bet

The most valuable SMB software companies of the last decade — Gusto, Toast, ServiceTitan, Carta — all share a pattern:

> **Become the system of record for an obligation the SMB legally cannot ignore. Distribute through the trusted professional already in the room.**

Compliance is the largest under-tooled SMB obligation left. The accountant is already in the room. **OperatorOS is the system of record.**

---

*For the investor narrative: see `PITCH.md`. For the full master plan with survey methodology, vertical deep-dives, and 5-phase rollout: see `OperatorOS_Project_Plan.md`. For setup and architecture: see `README.md`.*
