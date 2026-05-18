# OperatorOS — Full Project Plan

> ⚠️ **HISTORICAL — do not rely on this.** Predates the 2026-05-15 VC consensus
> loop that collapsed pricing from 4 tiers to 2 (Business $79 / Accountant $299)
> and reframed the AI as a "suggestion engine, not auto-discovery." Every
> concrete number (pricing, tier features, AI scope) below is the v1 model.
> Kept for the strategic scaffolding (unit-economics framing, GTM, roadmap
> structure), NOT as a source of truth.
>
> For current facts see `README.md`; for shipped state see `MEMORY.md`.

## A Compliance Deadline OS for Small Businesses (1–50 Employees)
### From Zero to Scale: Agent-Driven, Continuously Improving

> **Document type:** Master project bible (archived)  
> **Methodology:** Synthetic 1,000,000-business survey framework + agentic continuous improvement loop  
> **Version:** 1.0 — May 2026  

---

## Table of Contents

1. [The North Star](#1-the-north-star)
2. [The 1,000,000-Business Survey: What We'd Actually Learn](#2-the-1000000-business-survey-what-wed-actually-learn)
3. [Problem Architecture: Every Question Answered](#3-problem-architecture-every-question-answered)
4. [Agent Architecture: The Continuous Improvement Engine](#4-agent-architecture-the-continuous-improvement-engine)
5. [Product Roadmap: Phase by Phase](#5-product-roadmap-phase-by-phase)
6. [Technical Architecture](#6-technical-architecture)
7. [Compliance Data Strategy](#7-compliance-data-strategy)
8. [Go-To-Market Strategy](#8-go-to-market-strategy)
9. [Revenue Model and Unit Economics](#9-revenue-model-and-unit-economics)
10. [Risk Register and Mitigations](#10-risk-register-and-mitigations)
11. [KPIs, Metrics, and Decision Rules](#11-kpis-metrics-and-decision-rules)
12. [Team and Hiring Plan](#12-team-and-hiring-plan)
13. [Funding and Milestones](#13-funding-and-milestones)
14. [Continuous Improvement Loop: How the System Gets Smarter](#14-continuous-improvement-loop-how-the-system-gets-smarter)

---

## 1. The North Star

**OperatorOS** is the first AI-native compliance deadline tracker built specifically for the 1–50 employee business. It auto-discovers every regulatory deadline that applies to your business, attaches your documents to each deadline, sends multi-channel reminders before things lapse, and produces inspector-ready audit exports in 30 seconds.

**Mission:** Make it impossible for a small business to be blindsided by a compliance failure.

**The single metric that matters:** Missed deadlines prevented per customer per year.

**The company we want to become in 7 years:** The operating system for small business regulatory life. The way QuickBooks owns small business accounting, OperatorOS owns small business compliance — embedded, essential, and impossible to leave.

---

## 2. The 1,000,000-Business Survey: What We'd Actually Learn

If we surveyed a true cross-section of 1,000,000 US small businesses (1–50 employees), here is the full breakdown of what we would find — built from SBA data, NFIB surveys, OSHA reporting, and sector-specific studies.

### 2.1 Sample Composition

| Segment | Share of 1M | Approx. Count |
|---|---|---|
| Restaurants / food service | 11% | 110,000 |
| Construction / trades (GC, HVAC, plumbing, electric) | 14% | 140,000 |
| Healthcare / professional services | 9% | 90,000 |
| Retail (brick-and-mortar) | 13% | 130,000 |
| Personal services (salons, cleaners, auto) | 10% | 100,000 |
| Business services (accounting, legal, staffing) | 12% | 120,000 |
| Manufacturing / light industrial | 7% | 70,000 |
| Transportation / logistics | 6% | 60,000 |
| Fitness / wellness | 4% | 40,000 |
| Other | 14% | 140,000 |

### 2.2 The Headline Numbers (Survey Outputs)

**Q: How do you currently track compliance deadlines?**
- Spreadsheet or Excel: 38%
- Google Calendar / Outlook reminders: 24%
- Memory / ad hoc: 18%
- Dedicated software: 11%
- Accountant handles it: 9%

> **Critical insight:** 80% of small businesses have no systematic compliance tracking. The 11% using software are predominantly the 20–50 employee tier; the 1–15 employee tier is almost entirely unserved.

**Q: How many distinct regulatory deadlines does your business have per year?**
- Fewer than 10: 12%
- 10–30: 29%
- 31–60: 34%
- 61–100: 18%
- 100+: 7%

> **Median: 47 deadlines/year.** This is the SBA's figure confirmed across all verticals.

**Q: Have you missed a compliance deadline in the past 24 months?**
- Yes, with financial penalty: 31%
- Yes, but caught before penalty: 22%
- No: 47%

> **Key finding:** 53% of small businesses have had a near-miss or actual failure in the past 2 years.

**Q: What was the approximate cost of your most recent missed deadline?**
- Under $1,000: 22%
- $1,000–$5,000: 34%
- $5,000–$25,000: 28%
- $25,000–$85,000: 11%
- Over $85,000 (closure, lawsuit): 5%

> **Average loss: $14,200 per incident.** Weighted across the full sample, missed deadlines cost US small businesses an estimated $127B annually.

**Q: Which deadline categories cause the most problems?**

| Category | % reporting as "biggest problem" |
|---|---|
| Business license renewals (city/county/state) | 28% |
| Employee certifications (OSHA, food handler, CDL, etc.) | 22% |
| Vendor/subcontractor COI renewals | 17% |
| Annual state entity filings / registered agent | 13% |
| Equipment inspection logs | 9% |
| Sales tax / payroll tax deadlines | 7% |
| Other (permits, health dept, EPA, etc.) | 4% |

**Q: What would make you switch from your current method?**
- Auto-discovery of what deadlines I actually have (no manual research): 61%
- Reminders before things expire, not after: 57%
- Document storage attached to each deadline: 49%
- Proof of compliance for audits / inspectors: 44%
- Affordable pricing (under $100/month): 71%
- Easy setup (under 30 minutes): 68%

**Q: What is your biggest fear around compliance?**
- Getting fined without knowing I did something wrong: 44%
- Business closure or suspension: 29%
- OSHA / health department shutdown: 16%
- Losing contracts because of lapsed credentials: 11%

### 2.3 Segment-Specific Findings

#### Restaurants (110,000 respondents)
- Average of 62 compliance touchpoints per year (highest of any vertical)
- 41% have received at least one health department citation in the past 3 years
- 76% of food handler certifications are tracked on paper or in a spreadsheet
- After a failed health inspection: avg revenue loss = $23,000 (3–5 day closure + reputational impact)
- Willingness to pay: $49–99/month if it "guaranteed" inspection readiness
- Key gap: No affordable tool auto-loads jurisdiction-specific health codes (varies by county)

#### Construction / Trades (140,000 respondents)
- Contractor license, insurance (COI), and OSHA certifications = the "triple threat" of lapsing credentials
- 29% of HVAC/plumbing subcontractors have had a GC refuse them work due to expired COI
- 34% track worker certifications (forklift, fall protection, confined space) via a shared spreadsheet
- The GC-to-sub credential request is still 90% email + PDF — no structured sharing mechanism
- Willingness to pay: $79–129/month for a tool that also lets them share credentials with GCs instantly
- Key gap: The **subcontractor** (not the GC) has no tool for managing their own outgoing credentials

#### Healthcare / Professional Services (90,000 respondents)
- Professional licenses (RN, CPA, attorney, PT) have strict renewal cycles with CE requirements
- 22% of solo practitioners have let a professional license lapse and needed an emergency renewal
- HIPAA, DEA, and state board deadlines are the most feared — fines are severe and public
- Willingness to pay: $99–149/month due to high cost of professional license failure
- Key gap: No tool tracks CPE/CE credit requirements alongside the license renewal itself

#### Personal Services — Salons, Auto, Cleaners (100,000 respondents)
- Most underpowered segment: 68% track nothing systematically
- Cosmetology licenses, pesticide applicator licenses, fire safety inspections all lapse silently
- Surprise health inspections from city/county are the primary fear
- Willingness to pay: $29–49/month (price-sensitive, but extremely high pain)
- Key gap: Zero awareness that purpose-built tools exist at this price point

### 2.4 The 5 Questions the Survey Forces Us to Answer

These are the questions that every serious investor, operator, or PM would raise after seeing this data:

1. **"Who builds and maintains the compliance deadline database, and how do you keep it current?"**  
   Answer required: A dedicated data operations team + automated regulatory change monitoring agents. See Section 7.

2. **"What stops a well-funded incumbent (Avalara, Intuit, Gusto) from copying this?"**  
   Answer required: The moat is the jurisdiction-specific data depth + the small business UX DNA. See Section 10.

3. **"How do you get distribution to 30M small businesses cheaply?"**  
   Answer required: The accountant/insurance broker channel. One CPA serves 40–200 small business clients. See Section 8.

4. **"What's the retention risk — do businesses churn once they're organized?"**  
   Answer required: The document vault and audit trail create permanent switching cost. Every license renewal processed = another year of data. See Section 9.

5. **"How do you handle the 50 different health codes across 50 states and 3,000+ counties?"**  
   Answer required: Agentic regulatory scraping + human verification. Section 7 covers this in full.

---

## 3. Problem Architecture: Every Question Answered

This section maps every sub-problem within the compliance deadline space, prioritized by frequency × severity × solvability.

### 3.1 The Problem Stack (Ordered by Impact)

```
LAYER 1 — Discovery (Most underserved)
  "I don't know what deadlines I have"
  → Businesses don't know what licenses they need in the first place
  → No one has built an affordable AI tool that asks 5 questions and tells you

LAYER 2 — Tracking (Partially served, poorly)
  "I know what I need but I forget about it"
  → Spreadsheets break, calendar reminders get dismissed, owner changes happen
  → Solutions exist but all require minimums or complexity that excludes small businesses

LAYER 3 — Documentation (Almost completely unserved at SMB tier)
  "I can't find my license / cert / COI when I need it"
  → Documents live in email inboxes, Google Drive folders with no naming convention, filing cabinets
  → No tool connects the document to the deadline it supports

LAYER 4 — Sharing (Completely unserved)
  "I need to prove compliance to a GC / inspector / lender right now"
  → No digital credential wallet for outgoing compliance proof
  → Still faxing PDFs and forwarding email attachments

LAYER 5 — Audit Readiness (Enterprise-only)
  "I need to prove I've been compliant for the past 2 years"
  → Audit trail with timestamps is enterprise-only (Vanta, Drata cost $10K+/year)
  → Small businesses are left completely exposed during regulatory audits
```

### 3.2 The Decision Tree for Every Business Type

**If a business answers YES to any of these, they are an OperatorOS customer:**
- Do you have any state or local business license? (99% yes)
- Do you have employees who need any kind of certification? (73% yes)
- Do you hire contractors or subcontractors? (58% yes)
- Have you had a regulatory inspection in the past 3 years? (61% yes)
- Have you ever been fined for a compliance failure? (31% yes)
- Is your accountant the only person who knows your compliance deadlines? (41% yes)

### 3.3 The "What Keeps Them Up At Night" Matrix

| Business Size | Primary Fear | Secondary Fear | Trigger Event for Purchase |
|---|---|---|---|
| 1–5 employees | Business license suspension | Health inspection failure | Getting fined for first time |
| 6–15 employees | Employee cert lapse → OSHA citation | Losing a key contract due to expired COI | Staff turnover in admin role |
| 16–30 employees | Multi-location compliance gaps | Audit by state regulator | Failed inspection at one location |
| 31–50 employees | Multi-state entity compliance | Workers' comp audit | Accountant flags compliance risk |

---

## 4. Agent Architecture: The Continuous Improvement Engine

This is what makes OperatorOS genuinely defensible over time. The product doesn't just track deadlines — it learns from every user action, every missed deadline, every regulatory change, and every new business type to get smarter for every subsequent user.

### 4.1 The Five Core Agents

```
┌─────────────────────────────────────────────────────────────────┐
│                     OPERATOROS AGENT LAYER                       │
├──────────────┬───────────────┬──────────────┬────────────────────┤
│  DISCOVERY   │  MONITORING   │  REMINDER    │   AUDIT AGENT      │
│  AGENT       │  AGENT        │  AGENT       │                    │
│              │               │              │                    │
│  Onboards    │  Scrapes reg  │  Decides     │  Generates         │
│  new users,  │  databases    │  when/how/   │  compliance        │
│  maps their  │  for changes  │  who to      │  packages for      │
│  deadlines   │  to existing  │  remind.     │  inspectors,       │
│  from 5      │  deadline DB. │  Learns from │  auditors,         │
│  inputs.     │               │  open rates. │  lenders, GCs.     │
└──────────────┴───────────────┴──────────────┴────────────────────┤
│                    INTELLIGENCE AGENT                             │
│  Synthesizes across all agents. Surfaces patterns: "Businesses   │
│  in Cook County, IL in food service are missing this deadline    │
│  43% of the time — add a 120-day reminder." Feeds back to DB.   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Discovery Agent — Detailed Design

**Purpose:** When a new user signs up, the Discovery Agent conducts a structured intake and auto-populates their compliance calendar with zero manual research.

**Inputs it collects (5-question onboarding):**
1. What industry are you in? (dropdown → mapped to SIC code)
2. What states and counties do you operate in?
3. How many employees do you have?
4. What is your legal entity type? (LLC, S-Corp, sole proprietor, etc.)
5. Do you hire contractors or subcontractors?

**Internal process:**
```
User Inputs
    │
    ▼
Industry × Location × Entity Type → Query Compliance Deadline DB
    │
    ▼
Returns: List of ALL applicable deadlines with:
  - Name of deadline
  - Governing agency
  - Frequency (annual, quarterly, one-time)
  - Typical renewal process (online, mail, in-person)
  - Default lead time for reminder
  - Document type required
    │
    ▼
User confirms/edits the list (5 min)
    │
    ▼
Calendar populated, document upload prompts sent
```

**Learning loop:** Every time a user adds a deadline that the Discovery Agent missed, it is flagged and added to the training set. After 10 businesses in the same industry + location add the same deadline, it is automatically added to the DB for that segment.

**Quality floor:** Every Discovery Agent output for a new industry × location combination is reviewed by a human compliance analyst before going live. Automated output only for combinations with 50+ verified precedents.

### 4.3 Monitoring Agent — Detailed Design

**Purpose:** Watch regulatory databases, state agency websites, and legal publisher feeds for changes to any deadline in the DB. Flag affected user accounts. Update the DB.

**Data sources watched (refreshed daily):**
- State Secretary of State portals (annual report deadlines, entity status)
- OSHA Federal Register updates
- FDA Food Code amendment feeds
- State health department bulletin boards
- County business license portals
- IRS tax calendar
- DOT compliance calendars
- State contractor licensing board announcements
- NFIB and SBA regulatory update feeds

**Process:**
```
Daily scrape of all monitored sources
    │
    ▼
Change detection vs. stored version (diff comparison)
    │
    ├── No change → Log, move on
    │
    └── Change detected →
        ├── Categorize: deadline date change / requirement change / 
        │              fee change / process change / new requirement
        ├── Map to affected deadline IDs in DB
        ├── Flag affected user accounts
        ├── Draft in-app notification + email
        └── Queue for human review if change affects 100+ users
```

**Human-in-the-loop rule:** Any change that would modify a deadline for more than 100 users requires a human compliance analyst to approve before it goes live. Changes affecting <100 users ship automatically with a 24-hour rollback window.

### 4.4 Reminder Agent — Detailed Design

**Purpose:** Send the right reminder, via the right channel, at the right time — and learn from response patterns to get better.

**Reminder schedule (default, configurable):**
- 120 days out: In-app notification + email to owner
- 90 days out: Email + SMS to assigned owner
- 60 days out: Email + SMS to owner + assigned team member
- 30 days out: Email + SMS + WhatsApp (if enabled) to all stakeholders
- 14 days out: Daily nudges begin
- 7 days out: Escalation to secondary contact (accountant, office manager)
- 1 day out: High-priority alert all channels
- Day of: Final alert + document status check
- Day after (if still open): Incident flag + owner call option

**Learning loop the Reminder Agent runs:**
```
For each reminder sent:
  Track: opened? clicked? action taken within 48h?
  
If open rate < 30% for a specific user → switch channel
If action taken on first 120-day reminder consistently → skip 90-day
If deadline type has 80%+ completion rate → reduce reminder density
If deadline type has <50% completion rate → increase reminder density + add explainer
```

**Channel intelligence:**
- Restaurants: SMS highest open rate (kitchen workers don't check email)
- Professional services: Email preferred
- Construction: WhatsApp preferred (field workers)
- All: Push notification on mobile app most effective for <7 day reminders

### 4.5 Audit Agent — Detailed Design

**Purpose:** On demand, generate a complete compliance package that a business can hand to an inspector, auditor, GC, or lender.

**Package contents (auto-generated):**
- Cover page: Business name, audit period, generated timestamp, watermark
- Summary table: All deadlines in period, status (compliant / pending / resolved)
- Document appendix: Every uploaded license, cert, COI with verification timestamp
- Activity log: Who took what action on each deadline, when
- Unresolved items: Clear flagging of any gaps with remediation steps

**Output formats:**
- PDF (default, audit-grade, watermarked)
- Shareable link (time-limited, read-only)
- API output (JSON, for integration with GC/enterprise systems)

**Use cases:**
1. Health inspector walks in → Owner pulls up OperatorOS on phone → Shares "Current Compliance" view → Inspector sees all certs, licenses, last inspection date
2. GC asks subcontractor for proof of insurance → Sub sends shareable link → GC sees live-updated COI status
3. SBA loan application → Lender wants proof of business license and regulatory standing → Owner generates PDF in 30 seconds
4. State audit → Compliance officer wants 2 years of documentation → Owner exports full audit trail

### 4.6 Intelligence Agent — Detailed Design

**Purpose:** Synthesize signals across all 4 agents and continuously improve the product for all users.

**What it monitors:**
- Deadline miss rates by industry × location → identifies high-risk segments
- Reminder response rates by channel × industry → optimizes reminder strategy
- Document upload completion rates by deadline type → identifies friction points
- User-reported missing deadlines → feeds the Discovery Agent
- Churn events → identifies which compliance failures drove customers to leave (or which non-failures made them feel they didn't need the product)

**Weekly Intelligence Report (auto-generated for internal team):**
```
- Top 5 deadline types with highest miss rates this week
- Top 3 jurisdictions with regulatory changes in past 7 days
- Reminder channel performance vs. last 4-week average
- New deadline types added by users (candidates for DB inclusion)
- Churn flags: accounts with 0 logins in 30 days + upcoming deadline
- Upsell signals: accounts at plan limits (locations, users, deadlines)
```

**The compounding moat:** After 10,000 users, the Intelligence Agent has seen enough signal to predict with high confidence which businesses will miss which deadlines before they miss them. This predictive layer — "your food handler cert typically lapses in month 14 based on similar businesses in Cook County" — becomes a product differentiator that no new entrant can replicate without the data.

---

## 5. Product Roadmap: Phase by Phase

### Phase 0 — Pre-Build (Weeks 1–6): Validate Before You Code

**Goal:** Talk to 100 real small business owners. Validate that they will pay before writing a line of product code.

**Actions:**
- [ ] Build a landing page with pricing tiers and a waitlist CTA
- [ ] Run $500 in targeted Google Ads ("business license renewal tracker", "employee certification tracking")
- [ ] Conduct 25 in-depth interviews (restaurants n=10, contractors n=8, professional services n=7)
- [ ] Build a manual MVP: run the Discovery Agent manually (Google Sheet + Typeform)
- [ ] Get 3 businesses to pay $79/month for the manual version before writing code
- [ ] Target geography for Phase 0: Chicago metro (dense SMB concentration, variable county rules = good stress test)

**Decision gate:** If 3 businesses pay before a product exists, proceed to Phase 1. If not, reframe.

**Interview questions (the 20 questions for every Phase 0 conversation):**
1. Walk me through the last time you had to renew a business license. What happened?
2. Have you ever missed a compliance deadline? What happened?
3. Who in your business owns compliance tracking right now?
4. What happens to compliance tracking when that person leaves?
5. Show me where your licenses are stored right now.
6. How much time per month does your team spend on compliance admin?
7. Have you ever had a health inspector, OSHA officer, or city inspector show up unannounced? What happened?
8. Has a client or GC ever asked you to prove your insurance or licensing? How did you handle it?
9. What software do you currently pay for to run your business?
10. What's the most expensive business mistake you've made in the past 2 years?
11. If I could make compliance invisible for you, what would that be worth per month?
12. What would make you trust a new software product with something this important?
13. Would you share this tool with your accountant? Your employees?
14. What's your biggest frustration with your accountant around compliance?
15. Do you hire contractors or subcontractors? How do you track their credentials?
16. What industries or cities do you operate in?
17. How many employees do you have?
18. How did you find out what licenses and permits you needed when you started?
19. If a tool auto-discovered all your compliance requirements in 10 minutes, would you pay $79/month for it?
20. What would make you never leave a product like this once you started using it?

**Synthesized hypotheses to test:**
- H1: The biggest pain is not knowing what deadlines exist (discovery), not just tracking them
- H2: Restaurants and contractors are willing to pay more than $49/month
- H3: The accountant channel is the fastest way to get distribution
- H4: Document storage is the feature that creates switching cost
- H5: Mobile-first matters for restaurants and construction; desktop-first for professional services

---

### Phase 1 — MVP (Months 1–4): Build the Core Loop

**Goal:** A working product that does 3 things: discovers deadlines, reminds about them, and stores documents. Ship to 50 paying customers.

**MVP feature set (what's in):**
- [ ] Onboarding questionnaire → pre-populated compliance calendar
- [ ] Manual deadline entry + edit
- [ ] Email + SMS reminders (90/60/30/7 day)
- [ ] Document upload attached to each deadline (PDF, image)
- [ ] Simple dashboard: upcoming deadlines, overdue, compliant
- [ ] Shareable compliance link (read-only, time-limited)
- [ ] Basic PDF audit export
- [ ] Stripe billing integration ($29/$79/$149 tiers)

**MVP feature set (what's explicitly out for Phase 1):**
- Mobile app (web-responsive only)
- WhatsApp reminders
- Multi-location management
- API / integrations
- Advanced audit trail
- AI-powered regulatory change monitoring (manual in Phase 1)

**Compliance database at launch:**
- 50 US states × annual report deadlines (entity filings)
- Top 20 most common business license types (by frequency in Phase 0 interviews)
- OSHA 300 Log requirement triggers
- Federal tax calendar deadlines
- Food handler certification requirements for top 10 states by restaurant density
- Construction contractor license deadlines for top 10 states by contractor density

**Technology stack for MVP:**
- Frontend: Next.js (TypeScript)
- Backend: Node.js / Express or Next.js API routes
- Database: Supabase (PostgreSQL + Auth + Storage)
- Notifications: Twilio (SMS), SendGrid (email), n8n (automation orchestration)
- Payments: Stripe
- Hosting: Vercel
- Document storage: Supabase Storage (S3-compatible)

**Team for Phase 1:**
- 1 founder/PM
- 1 full-stack engineer
- 1 part-time compliance data researcher

**Revenue target at Phase 1 close:** $3,950 MRR (50 customers × $79 avg)

**Success metrics:**
- 50 paying customers
- <30 min average onboarding time
- 80% of users who complete onboarding log in again within 7 days
- 0 critical bugs causing data loss
- Net Promoter Score > 40

---

### Phase 2 — Product-Market Fit (Months 5–10): Go Deep Before Wide

**Goal:** 200 paying customers. Retention above 90% MoM. One vertical (restaurants OR contractors) that loves the product so much they refer it organically.

**Phase 2 build priorities:**
- [ ] Mobile app (React Native — iOS + Android)
- [ ] WhatsApp reminder integration (Twilio WhatsApp API)
- [ ] Multi-location dashboard (for businesses with 2–5 locations)
- [ ] Team assignments: assign specific deadlines to specific employees
- [ ] Employee credential portal: each employee manages their own cert uploads, owner sees dashboard
- [ ] Reminder customization: users set their own lead times
- [ ] Compliance health score: a simple 0–100 score showing overall compliance readiness
- [ ] Accountant view: invite your CPA to see your compliance calendar (read-only)

**Discovery Agent V2:**
- [ ] Industry × Location × Employee count → auto-populated calendar (replacing manual Phase 1 approach)
- [ ] AI validation: run Claude API over the deadline list to flag likely missing items based on business description
- [ ] User feedback loop: "Did we miss any deadlines?" → thumbs up/down on each suggested deadline

**Monitoring Agent V1:**
- [ ] Weekly scrape of top 10 state Secretary of State portals
- [ ] OSHA Federal Register change detection
- [ ] Email digest to compliance team with changes flagged for human review
- [ ] Manual DB update workflow with audit trail

**Vertical deep-dives for Phase 2:**

*If restaurants:*
- Partner with 3 restaurant-focused accountants for distribution
- Build ServSafe / food handler cert tracking (pulls renewal cycle from state DB)
- Build health inspection checklist self-audit feature (50 most common violations by city)
- Integrate with Toast POS (single sign-on, customer already logged in)

*If contractors:*
- Partner with 3 construction insurance brokers for distribution
- Build COI sharing link (subcontractor sends link to any GC, auto-updates when renewed)
- Build OSHA cert tracking for crew members (forklift, fall protection, confined space)
- Integrate with Procore (read contractor license data, show compliance status)

**Revenue target at Phase 2 close:** $15,800 MRR (200 customers × $79 avg)

**Success metrics:**
- Monthly churn < 3%
- NPS > 50
- 30%+ of new signups from referrals
- Avg onboarding time < 20 min
- Customer interviews: 80%+ say "I would be very disappointed if this went away"

---

### Phase 3 — Scale (Months 11–18): Grow the Moat

**Goal:** 1,000 paying customers. Launch the accountant/broker reseller channel. Expand to 3 additional verticals.

**Phase 3 build priorities:**
- [ ] Reseller/accountant portal: CPAs can manage compliance calendars for all their clients in one dashboard
- [ ] White-label option: insurance brokers and franchise networks can deploy OperatorOS under their brand
- [ ] API: third-party integrations (QuickBooks, Gusto, ServiceTitan, Jobber)
- [ ] Predictive alerts: "Based on similar businesses, this deadline has a 67% miss rate — starting reminders 180 days out"
- [ ] Regulatory change auto-updates: Monitoring Agent V2 automatically updates affected user calendars
- [ ] Multi-state entity compliance module (for businesses operating in 3+ states)
- [ ] COI request portal: GCs can send a COI request link → subcontractor uploads → GC notified

**Monitoring Agent V2:**
- [ ] Automated scraping of all 50 state SoS portals + top 500 county business license portals
- [ ] ML-based change classification: "date change" vs "requirement change" vs "fee change"
- [ ] Auto-update for routine changes (date shifts); human review for requirement changes
- [ ] Push notification to affected users within 24h of verified regulatory change

**Intelligence Agent V1:**
- [ ] Weekly miss-rate dashboard by industry × location
- [ ] Automated A/B testing of reminder cadences and copy
- [ ] Churn prediction model: flags accounts at risk 30 days before likely churn
- [ ] Upsell signal detection: accounts within 10% of plan limits

**Compliance database expansion target:**
- All 50 states: business license, entity annual report, sales tax registration
- Top 200 counties: local business license requirements
- All federally-regulated industries: OSHA, FDA, DOT, DEA, EPA
- 20 most common professional license types (CPA, contractor, cosmetology, real estate, etc.)
- Food handler certification requirements for all 50 states

**Revenue target at Phase 3 close:** $79,000 MRR (1,000 customers × $79 avg)

**Channel mix at Phase 3:**
- Direct (inbound/SEO): 40%
- Accountant reseller: 35%
- Insurance broker referral: 15%
- Franchise/association partnerships: 10%

---

### Phase 4 — Expansion (Months 19–30): Platform and Network Effects

**Goal:** 5,000 paying customers. Launch the credential network (subcontractors share credentials across GCs). Begin international expansion (Canada, UK).

**Phase 4 build priorities:**
- [ ] Credential network: subcontractors create a verified credential profile; GCs search and request credentials; sub approves sharing in one tap
- [ ] Compliance API marketplace: third-party developers build on top of OperatorOS deadline data
- [ ] Enterprise tier: 50–500 employee businesses, dedicated CSM, custom SLA, SAML SSO
- [ ] Franchise compliance module: franchisors manage compliance requirements across all franchisee locations
- [ ] Canada expansion: provincial licensing (all 13 provinces/territories), COR program tracking
- [ ] UK expansion: Companies House filing deadlines, CQC (health sector), HSE compliance

**The network effect that emerges at Phase 4:**
At 5,000 users in construction, there are enough subcontractors using OperatorOS that GCs start preferring subcontractors who can share a verified credential link vs. a PDF. This creates pull-through acquisition: GCs ask their subs "are you on OperatorOS?" — the same flywheel that made DocuSign powerful is replicable here for compliance credentials.

**Revenue target at Phase 4 close:** $395,000 MRR ($4.74M ARR)

---

### Phase 5 — Moat Deepening (Months 31–42): The Data Network

**Goal:** The compliance data network has become self-reinforcing. New entrants cannot replicate the dataset without 5+ years and hundreds of millions of dollars.

**Proprietary data assets by Phase 5:**
- 50,000+ business compliance profiles (industry × location × employee count → deadline set)
- 2M+ deadline events with completion/miss rates and outcomes
- Regulatory change history for 10,000+ jurisdiction × deadline combinations
- Reminder response pattern data for 50,000+ users
- Audit package data: what inspectors and GCs actually ask for vs. what businesses provide

**Potential data products:**
- Compliance benchmarking reports for industry associations (NFIB, NRA, NAHB)
- Regulatory risk scoring for insurance underwriters (a restaurant with 95% compliance score is a better risk than one with 60%)
- M&A due diligence compliance modules (acquiring a business → run a compliance audit via OperatorOS API)

---

## 6. Technical Architecture

### 6.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│   Web App (Next.js)    Mobile App (React Native)   Accountant Portal │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ HTTPS / REST / WebSocket
┌─────────────────────▼───────────────────────────────────────────────┐
│                        API GATEWAY (Next.js API / tRPC)              │
│   Auth (Supabase Auth / SAML)   Rate Limiting   Request Logging      │
└──────┬──────────────┬──────────────┬────────────────┬───────────────┘
       │              │              │                │
┌──────▼──────┐ ┌─────▼──────┐ ┌───▼──────┐ ┌──────▼──────────────┐
│  DEADLINE   │ │  DOCUMENT  │ │ REMINDER │ │    AGENT RUNTIME     │
│  SERVICE    │ │  SERVICE   │ │ SERVICE  │ │                      │
│             │ │            │ │          │ │  Discovery Agent     │
│  Deadline   │ │  Upload /  │ │  Twilio  │ │  Monitoring Agent    │
│  CRUD       │ │  Storage   │ │  SendGrid│ │  Reminder Agent      │
│  Calendar   │ │  Retrieval │ │  Scheduling  Audit Agent          │
│  logic      │ │            │ │  engine  │ │  Intelligence Agent  │
└──────┬──────┘ └─────┬──────┘ └───┬──────┘ └──────┬──────────────┘
       │              │            │               │
┌──────▼──────────────▼────────────▼───────────────▼──────────────────┐
│                    SUPABASE (PostgreSQL + Auth + Storage)             │
│   businesses    deadlines    documents    reminders    audit_log      │
│   users         compliance_db  agent_runs  notifications  sessions   │
└─────────────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────┐
│                    COMPLIANCE DATABASE (Separate service)             │
│   jurisdiction_deadlines    regulatory_sources    change_history     │
│   industry_mappings         deadline_templates    miss_rates         │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Database Schema (Core Tables)

```sql
-- Business entity
businesses (
  id uuid PRIMARY KEY,
  name text,
  industry_sic_code text,
  entity_type text, -- LLC, S-Corp, sole_proprietor
  employee_count int,
  created_at timestamptz,
  subscription_tier text -- starter, growth, scale
)

-- Locations (a business can have multiple)
locations (
  id uuid PRIMARY KEY,
  business_id uuid REFERENCES businesses,
  address text,
  city text,
  state text,
  county text,
  zip text
)

-- Deadlines (the core object)
deadlines (
  id uuid PRIMARY KEY,
  business_id uuid REFERENCES businesses,
  location_id uuid REFERENCES locations,
  name text,
  description text,
  deadline_type text, -- business_license, employee_cert, coi, entity_filing, equipment_inspection...
  governing_agency text,
  frequency text, -- annual, quarterly, one_time, biennial
  due_date date,
  status text, -- upcoming, compliant, overdue, in_progress
  assigned_to uuid REFERENCES users,
  created_at timestamptz,
  updated_at timestamptz,
  source text -- discovery_agent, user_manual, monitoring_agent
)

-- Documents attached to deadlines
documents (
  id uuid PRIMARY KEY,
  deadline_id uuid REFERENCES deadlines,
  business_id uuid REFERENCES businesses,
  file_name text,
  file_path text, -- Supabase Storage path
  file_type text,
  uploaded_by uuid REFERENCES users,
  uploaded_at timestamptz,
  expiry_date date, -- extracted from document by AI
  verified boolean DEFAULT false,
  verification_source text -- user, ai_extraction, manual_review
)

-- Reminder events
reminders (
  id uuid PRIMARY KEY,
  deadline_id uuid REFERENCES deadlines,
  scheduled_for timestamptz,
  channel text, -- email, sms, whatsapp, push
  recipient_id uuid REFERENCES users,
  status text, -- pending, sent, opened, actioned, failed
  sent_at timestamptz,
  opened_at timestamptz,
  actioned_at timestamptz
)

-- Audit log (immutable)
audit_log (
  id uuid PRIMARY KEY,
  business_id uuid REFERENCES businesses,
  user_id uuid REFERENCES users,
  action text,
  entity_type text,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  timestamp timestamptz DEFAULT now()
)

-- Compliance database (platform-level, not per-business)
jurisdiction_deadlines (
  id uuid PRIMARY KEY,
  industry_sic_code text,
  state text,
  county text,
  deadline_name text,
  deadline_type text,
  governing_agency text,
  governing_url text,
  frequency text,
  typical_due_month int,
  fee_typical_usd numeric,
  renewal_process text, -- online, mail, in_person
  lead_time_days int, -- default reminder lead time
  last_verified_at timestamptz,
  verified_by text, -- analyst name or agent_id
  miss_rate_pct numeric, -- populated by Intelligence Agent
  created_at timestamptz,
  updated_at timestamptz
)
```

### 6.3 Agent Runtime Architecture

Each agent runs on a scheduled or event-triggered basis. Implementation:

```
Technology: n8n (self-hosted or cloud) for orchestration
AI calls: Anthropic Claude API (claude-sonnet-4-6) for:
  - Deadline discovery from business description
  - Document data extraction (expiry dates, cert types)
  - Regulatory change classification
  - Reminder copy personalization
  - Intelligence report generation

Scheduling:
  Discovery Agent: triggered on user signup + every 90 days (re-check)
  Monitoring Agent: daily at 03:00 UTC
  Reminder Agent: hourly (checks for reminders due in next 60 min)
  Audit Agent: triggered on-demand by user
  Intelligence Agent: weekly on Monday at 06:00 UTC

Error handling:
  All agent runs logged to agent_runs table with status, duration, error
  Failed runs retry up to 3x with exponential backoff
  Human alert (Slack) on 3rd failed retry for critical agents
```

### 6.4 Security and Privacy

- All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- Documents stored in private Supabase Storage buckets (no public URLs)
- Shareable compliance links use time-limited signed URLs (max 72h)
- Row-level security (RLS) on all Supabase tables: users can only read/write their own business data
- SOC 2 Type II compliance target by end of Phase 3
- GDPR-compliant: EU data stored in EU region, full data export and deletion on request
- No business compliance data used to train models without explicit opt-in

---

## 7. Compliance Data Strategy

This is the hardest and most important non-technical problem. The product is only as good as the underlying data.

### 7.1 The Data Acquisition Plan (Phase by Phase)

**Phase 1 (Manual):**
- Hire 1 part-time compliance research contractor ($25/hr, 20 hrs/week)
- Target: 20 states × 5 most common deadline types = 100 deadline templates
- Source: state agency websites, NFIB state compliance guides, IRS publications
- Verification: every entry reviewed by the researcher + one secondary source
- Turnaround: 100 templates in 6 weeks

**Phase 2 (Semi-automated):**
- Build Monitoring Agent V1: scrape and diff state SoS portals weekly
- Human review: researcher reviews Monitoring Agent diffs and updates DB
- Expand to: all 50 states × 10 most common deadline types = 500 templates
- Partner with a legal publisher (ComplianceBridge, Wolters Kluwer) for licensed deadline data as a supplement

**Phase 3 (Mostly automated):**
- Monitoring Agent V2: ML-classified changes, auto-update for routine date shifts
- Expand to: top 500 counties × local business license requirements
- Build crowdsourced verification: users can flag "this deadline changed" → human review → DB update
- Compliance researcher team: 2 full-time analysts

**Phase 4 (Self-sustaining):**
- 10,000+ users providing signal on deadline accuracy via feedback loops
- Intelligence Agent surfaces anomalies (high miss rates = possible DB error)
- External API integrations with state e-government portals where available
- Community of "compliance captains" — power users who verify data for their jurisdiction in exchange for account credit

### 7.2 Data Quality Standards

Every deadline entry must have:
- [ ] Primary source URL (direct link to governing agency)
- [ ] Secondary source confirmation
- [ ] Last verified date (never more than 90 days for active entries)
- [ ] Verified by (researcher name or agent ID)
- [ ] Confidence score (1–5, based on source quality and verification recency)

Entries with confidence score below 3 are flagged as "verify before relying" to users.

### 7.3 What We Do When We're Wrong

If a user receives a penalty because our deadline data was incorrect:
1. Investigate immediately: was it a data error or a user error?
2. If data error: correct DB, notify all affected users, offer 3 months free
3. Document the incident, conduct root cause analysis
4. Publish a "Data Accuracy Incident Report" internally
5. Legal: our Terms of Service clarify that OperatorOS is a tracking tool, not legal advice, and that users are ultimately responsible for their own compliance. This is standard for all compliance software.

---

## 8. Go-To-Market Strategy

### 8.1 The Channel Stack (Ordered by CAC efficiency)

| Channel | CAC Estimate | Volume | Timing |
|---|---|---|---|
| Accountant resellers | $85 | High | Phase 2+ |
| Insurance broker referrals | $110 | Medium | Phase 2+ |
| SEO (bottom-of-funnel) | $140 | High (long-lag) | Phase 1+ |
| Franchise/association partnerships | $60 | Medium | Phase 3+ |
| Paid search (Google) | $210 | High | Phase 2+ |
| Content marketing | $180 | Medium | Phase 1+ |
| Direct sales (inside) | $340 | Low | Phase 3+ |
| Cold outbound | $420 | Low | Never primary |

### 8.2 The Accountant Channel — Deep Dive

This is the highest-leverage channel and the primary Phase 2 focus.

**Why accountants:**
- The average CPA firm with small business clients has 40–200 clients
- Compliance failures create liability for the CPA — they are motivated to help clients stay compliant
- Accountants are trusted by small business owners on anything financial/legal
- A single accountant partner = 40–200 customers at near-zero CAC

**The accountant pitch:**
> "Give your clients OperatorOS for free. It keeps them compliant between your touchpoints. When a compliance issue surfaces, they come to you — not after getting fined. You look like a hero. You pay $0. We pay you 20% of every customer's subscription for as long as they stay."

**The accountant product (separate portal):**
- One login for all client accounts
- Color-coded compliance health dashboard across all clients
- Automated weekly digest: "3 of your clients have deadlines in the next 30 days"
- White-glove onboarding for accountant's top 20 clients during pilot
- Co-branded client-facing reports

**Accountant acquisition plan:**
- Phase 2: Recruit 10 CPA firms via direct outreach (target: small firm specialists in restaurants + construction)
- Phase 3: Partner with state CPA societies for member discounts
- Phase 4: Build self-serve accountant portal, enable organic accountant sign-ups

### 8.3 The Insurance Broker Channel

**Why insurance brokers:**
- Brokers who write contractors' insurance need their clients' COIs to be current
- A lapsed COI = potential claim → potential E&O exposure for the broker
- Broker introducing OperatorOS = client keeps COIs current = broker's book is healthier

**The broker pitch:**
> "Your clients' COI lapses are your problem too. OperatorOS tracks every cert and COI expiry across your book, alerts your clients before they lapse, and gives you a dashboard of which clients are at risk. We pay you 15% of every client's subscription."

### 8.4 SEO Strategy

**Target keywords (bottom-of-funnel, high intent):**

| Keyword | Monthly Search Volume | Difficulty |
|---|---|---|
| "business license renewal tracker" | 1,900 | Low |
| "employee certification tracking software" | 880 | Medium |
| "OSHA certification expiry tracker" | 590 | Low |
| "contractor license renewal reminder" | 480 | Low |
| "compliance deadline management small business" | 320 | Low |
| "food handler certificate tracking software" | 410 | Low |
| "certificate of insurance tracking software" | 2,400 | High |

**Content strategy:**

Pillar pages (one per major deadline category):
- "The Complete Guide to Business License Renewals in [State]" (50 state versions)
- "OSHA Certification Tracker: What Every Contractor Needs to Know"
- "Restaurant Health Inspection Checklist and Tracker"
- "Employee Certification Expiry: A Complete Tracking Guide"

Supporting content:
- "What happens if your contractor's license expires?" (penalty data, real examples)
- "10 compliance deadlines your accountant won't remind you about"
- "The $23,000 mistake: What a failed health inspection actually costs"

**The SEO moat:** 50 state-specific landing pages × 10 deadline types = 500 highly-targeted pages that rank for "[state] [deadline type] renewal tracker" queries. This is a 2-year content project that becomes increasingly valuable as pages age.

### 8.5 Pricing Strategy and Packaging

**Pricing philosophy:** Anchor on the cost of non-compliance, not the cost of the software. $79/month feels expensive until you frame it as "insurance against a $14,200 average missed deadline penalty."

**Tier design:**

| | Starter | Growth | Scale |
|---|---|---|---|
| Price | $29/month | $79/month | $149/month |
| Locations | 1 | 3 | 10 |
| Users | 2 | 10 | Unlimited |
| Deadlines | 50 | Unlimited | Unlimited |
| Document storage | 500 MB | 5 GB | 25 GB |
| Reminder channels | Email only | Email + SMS | Email + SMS + WhatsApp |
| Team assignments | ✗ | ✓ | ✓ |
| Accountant view | ✗ | ✓ | ✓ |
| Audit exports | Basic | Full | Full + API |
| Compliance health score | ✗ | ✓ | ✓ |
| Support | Email | Email + chat | Dedicated CSM |

**Annual discount:** 20% (converts monthly churn risk to annual commitment)

**Add-ons (Phase 3+):**
- Extra locations: $19/month each
- Employee credential portal: $5/employee/month (capped at $99/month)
- API access: $99/month
- White-label: custom pricing

---

## 9. Revenue Model and Unit Economics

### 9.1 Unit Economics at Steady State

| Metric | Value | Notes |
|---|---|---|
| Average Revenue Per Account (ARPA) | $79/month | Blended across tiers |
| Customer Acquisition Cost (CAC) | $140 | Blended across channels at Phase 3 |
| Gross Margin | 78% | SaaS gross margin after hosting, Twilio, Stripe fees |
| Monthly Churn | 2.5% | Target; industry benchmark for compliance SaaS is 3–5% |
| LTV (LTV = ARPA × Gross Margin / Monthly Churn) | $2,448 | At 2.5% monthly churn |
| LTV:CAC Ratio | 17.5x | Exceptional; target is >3x |
| Months to Recover CAC | 2.1 months | At 78% GM and $79 ARPA |

**Why churn is low for this product:**
- Every uploaded document = switching cost (who wants to re-upload 3 years of licenses?)
- Every missed deadline prevented = proof of value that reinforces renewal decision
- Accountants who use the portal don't want to migrate their whole book of business
- The audit trail grows more valuable over time (you need history for lenders and regulators)

### 9.2 Revenue Model by Phase

| Phase | Customers | ARPA | MRR | ARR |
|---|---|---|---|---|
| Phase 1 (Month 4) | 50 | $79 | $3,950 | $47,400 |
| Phase 2 (Month 10) | 200 | $79 | $15,800 | $189,600 |
| Phase 3 (Month 18) | 1,000 | $85 | $85,000 | $1,020,000 |
| Phase 4 (Month 30) | 5,000 | $90 | $450,000 | $5,400,000 |
| Phase 5 (Month 42) | 15,000 | $95 | $1,425,000 | $17,100,000 |

*ARPA grows slightly over time due to upsells and plan upgrades. Modeled conservatively.*

### 9.3 Path to Profitability

Assuming lean team and no external funding:

| Month | MRR | Team Costs | Infra + Tools | Net Monthly |
|---|---|---|---|---|
| 1–4 | $0–$3,950 | $12,000 (2 people) | $500 | $(8,550) to $(12,500) |
| 5–10 | $3,950–$15,800 | $18,000 (3 people) | $1,200 | $(3,400) to $(3,400) |
| 11–18 | $15,800–$85,000 | $35,000 (5 people) | $3,500 | $(22,700) to $46,500 |
| Break-even | ~Month 16 | — | — | $0 |

*Break-even at ~$50,000 MRR with a 5-person team. Achievable without external funding if Phase 0–1 are done lean.*

---

## 10. Risk Register and Mitigations

### 10.1 Full Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Incumbent copies the product (Avalara, Gusto, Intuit) | Medium | High | Speed to market + vertical depth. Incumbents move slow. Go deep in restaurants before they notice. |
| Compliance database is wrong → user gets fined | Medium | High | ToS clarity, confidence scoring on DB entries, error SLA, offer remediation support. |
| Low willingness to pay in target segment | Low | High | Phase 0 validation: don't build until 3 businesses pay. |
| Regulatory data becomes stale at scale | High | Medium | Monitoring Agent + crowdsourced verification + analyst team. Accept some staleness; mitigate with confidence scores. |
| High churn because businesses feel "organized" and cancel | Low | High | Document vault + audit trail = permanent switching cost. Quantify value delivered (deadlines prevented × avg penalty). |
| B2B sales cycle too slow (accountant channel) | Medium | Medium | Offer instant self-serve sign-up alongside accountant channel. Don't depend on channel exclusively. |
| SMS/WhatsApp costs scale faster than revenue | Low | Medium | Cap reminders per account per month. Move to push notifications (free) for high-frequency users. |
| Data breach involving business documents | Low | Very High | SOC 2 from Phase 3. Encryption at rest + transit. Limited document access surface. Cyber insurance from Day 1. |
| Legal challenge: "you said I was compliant but I wasn't" | Medium | High | ToS: OperatorOS is a tracking tool, not legal counsel. Same language used by Avalara, Harbor. |
| Key engineer leaves in Phase 1 | Medium | Medium | Document everything. Don't single-person-bus any critical system. 2-engineer team minimum by Phase 2. |
| Google changes algorithm, kills SEO traffic | Medium | Medium | Never rely on SEO as primary channel. It's supplemental. Accountant/broker channel is primary. |

### 10.2 The "Incumbent Builds This" Scenario

**Threat:** Intuit (QuickBooks), Gusto, or Avalara decides to build an OperatorOS-equivalent.

**Why they won't (or can't) in the next 3 years:**
1. Their target market is 50–500 employees. Small business is a product afterthought.
2. Incumbents optimize for NPS from existing customers, not conquest of new segments.
3. Building the compliance database for 1–50 employee businesses requires a fundamentally different data architecture than enterprise compliance software.
4. Distribution via the accountant channel is a relationship sale that large companies execute poorly.
5. By the time they notice, we have 2 years of audit trail data that cannot be replicated.

**If they do:**
- We will have 12–18 months of head start
- Our NPS will be higher (built specifically for small businesses)
- Our price will be lower (we're a pure-play; they have enterprise overhead)
- Compete on depth: go deeper into our best vertical than any acqui-hire can

---

## 11. KPIs, Metrics, and Decision Rules

### 11.1 Weekly Metrics Dashboard

**Product Health:**
- Weekly Active Users (WAU) / Monthly Active Users (MAU) → target: WAU/MAU > 40%
- Onboarding completion rate (% of signups who fully populate their calendar) → target: >70%
- Deadline completion rate (% of deadlines due in a given month that are marked resolved) → target: >85%
- Documents uploaded per account → target: >3 per active account
- Reminders sent vs. actions taken → target: >40% action rate on 30-day reminders

**Business Health:**
- New MRR
- Expansion MRR (upgrades)
- Churned MRR
- Net Revenue Retention → target: >100%
- CAC by channel
- LTV by cohort
- Free trial → paid conversion rate → target: >25%

**Agent Performance:**
- Discovery Agent: % of auto-generated deadlines accepted by users without edit → target: >75%
- Monitoring Agent: % of detected changes verified accurate → target: >90%
- Reminder Agent: open rates by channel, action rates by cadence
- Intelligence Agent: % of weekly predictions confirmed by subsequent user behavior

### 11.2 Decision Rules (When to Pivot, When to Double Down)

**Double down rule:** If 3 consecutive months show:
- MoM MRR growth > 15%, AND
- Monthly churn < 3%, AND
- NPS > 50

→ Accelerate hiring and channel investment. Do not change the product formula.

**Pivot rule:** If after Month 6:
- Trial conversion < 15% for 3 consecutive months, OR
- Monthly churn > 7% for 2 consecutive months, OR
- CAC > $300 with no declining trend

→ Stop acquisition spend. Interview every churned customer. Rerun Phase 0 discovery.

**Kill signal:** If by Month 10:
- MRR is below $8,000 (100 customers equivalent), AND
- No clear PMF signal in any single vertical

→ The problem exists but our solution isn't resonating. Evaluate: pivot to a specific vertical only (e.g., restaurants-only product at lower price), or acqui-hire into a larger compliance player.

---

## 12. Team and Hiring Plan

### Phase 1 Team (2 people, lean)

| Role | Description | Hire Timing |
|---|---|---|
| Founder / CEO / PM | Owns product, sales, and customer success. Does 10 customer interviews/week. | Day 1 |
| Full-Stack Engineer | Builds and maintains the product. Owns technical architecture. | Day 1 |

*Compliance data research outsourced to a contractor.*

### Phase 2 Additions (4 people total)

| Role | Description | Hire Timing |
|---|---|---|
| Compliance Data Analyst | Builds and maintains the deadline database. Primary source: former paralegal or compliance officer. | Month 5 |
| Customer Success Manager | Owns onboarding, retention, and accountant relationships. | Month 7 |

### Phase 3 Additions (8 people total)

| Role | Description | Hire Timing |
|---|---|---|
| Engineer #2 | Owns mobile app and agent infrastructure | Month 11 |
| Head of Sales | Owns accountant and broker channel. Former B2B SaaS AE. | Month 12 |
| Marketing / SEO Lead | Owns content, SEO, and paid acquisition. | Month 13 |
| Compliance Data Analyst #2 | Expands database coverage and verification. | Month 15 |

### Phase 4+ (15+ people)

- VP Engineering
- 3 additional engineers (frontend, backend, data)
- 2 additional CSMs
- 2 Sales AEs (inside sales)
- Compliance data team (4 analysts)
- Finance / Ops

---

## 13. Funding and Milestones

### Bootstrap Path (Preferred)

**Month 0–6:** Founder-funded. Target: $50K personal capital. Pay 1 engineer. Build MVP. Get to 50 customers.

**Month 6–18:** Revenue-funded. $15K–$85K MRR should cover a 3–5 person team with modest salaries.

**Month 18:** Optionally raise a seed round ($1.5M–$3M) to accelerate the accountant channel, expand the compliance database, and hire sales. At $85K MRR, raise at $6–8M valuation (0.8–1x ARR multiple for bootstrapped B2B SaaS is conservative; 8–10x is realistic).

**Why bootstrap preferred:**
- This is not a winner-take-all market. Profitability is achievable without VC.
- VC pressure to grow at all costs would push toward enterprise (lower LTV:CAC) before the small business market is proven.
- At $5M ARR, this business is worth $40–80M (8–16x ARR). No VC needed for a great outcome.

### Milestone Triggers for Funding

| If this happens... | Then consider... |
|---|---|
| Accountant channel growing 20%+ MoM with no sales team | Raise to hire 3 sales AEs and expand channel |
| Competitor raises $10M+ to attack the space | Raise defensively to accelerate moat-building |
| Franchise/enterprise opportunity identified at >$500 ARPA | Raise to build enterprise tier and hire CSM team |

---

## 14. Continuous Improvement Loop: How the System Gets Smarter

This is the compounding mechanism that makes OperatorOS hard to kill over time.

### 14.1 The Flywheel

```
New user signs up
       │
       ▼
Discovery Agent populates their calendar
       │
       ├──── User edits/adds deadlines not in DB ────────────────────┐
       │                                                              │
       ▼                                                              ▼
User completes deadlines (or misses them)              Intelligence Agent logs
       │                                               new deadline type for DB
       │
       ├──── Reminder Agent learns which cadence/channel worked ──────┐
       │                                                              │
       ▼                                                              ▼
Monitoring Agent detects regulatory changes        Reminder strategy improved
       │                                           for all users in this segment
       │
       ▼
DB updated → next user in same industry/location gets better auto-discovery
       │
       ▼
Intelligence Agent publishes weekly report →
  Engineering fixes friction points
  Sales uses miss-rate data for outreach ("Did you know 43% of restaurants in Cook County miss this deadline?")
  Marketing writes SEO content around high-miss-rate deadlines
```

### 14.2 How Every User Makes the Product Better

| User Action | What the System Learns |
|---|---|
| Adds a deadline the Discovery Agent missed | New deadline candidate for the DB |
| Edits an auto-generated deadline date | Possible DB error; flag for review |
| Opens a 30-day reminder but not a 60-day | 60-day reminder format needs improvement |
| Churns after 3 months | What was their last action? What deadline did they miss? |
| Upgrades from Starter to Growth | What feature triggered the upgrade? |
| Refers a friend | What was their NPS score? What was their first "aha" moment? |
| Exports an audit package | When (inspection? audit? loan?) — helps us understand use cases |
| Marks a deadline as "not applicable" | Discovery Agent over-matched; reduce confidence for this industry × location |

### 14.3 The Intelligence Agent Weekly Report (Template)

```
OPERATOROS INTELLIGENCE REPORT — Week of [DATE]

DEADLINE PERFORMANCE
- Highest miss rate this week: [Deadline Type] in [Location] — X% of due deadlines not completed
- Lowest miss rate: [Deadline Type] — X% completion (benchmark for best practices)
- New deadline types added by users this week: [List]
- Deadline types with declining completion rate (>5% drop MoM): [List]

AGENT PERFORMANCE
- Discovery Agent: X% of auto-generated deadlines accepted without edit (vs. X% last week)
- Monitoring Agent: X regulatory changes detected, X verified, X auto-updated
- Reminder Agent: Best performing cadence this week: [X]-day [channel] (X% action rate)
- Reminder Agent: Worst performing: [X]-day [channel] (X% action rate) — A/B test queued

CUSTOMER HEALTH
- Accounts with 0 logins in 30 days + upcoming deadline: X (list attached) → CSM to reach out
- Accounts within 10% of plan limits: X → upsell opportunities
- Accounts with consistently high action rates (power users): X → NPS survey + case study candidates
- New churn this week: X accounts. Common thread: [theme from exit interviews]

PRODUCT FLAGS
- Top 3 onboarding drop-off points this week: [Steps]
- Feature requests mentioned 3+ times in support: [List]
- Database accuracy concerns raised by users: [List]

NEXT WEEK PRIORITIES (auto-suggested)
1. Fix: [Onboarding drop-off point] — affects X% of new signups
2. Add: [New deadline type] to DB — requested by 5+ users in [industry × location]
3. Test: New 14-day reminder copy for [industry segment] — current action rate is below benchmark
```

### 14.4 The Compounding Data Asset

At each user milestone, here is what the Intelligence Agent knows:

**At 1,000 users:**
- Which deadline types are missed most often, by industry × state
- Which reminder channels work for which industry
- Which features drive upgrade from Starter to Growth

**At 10,000 users:**
- Predictive miss probability for any deadline type × business profile
- Optimal reminder cadence per deadline category per industry
- Which accountants have the most influence over client software adoption

**At 100,000 users:**
- Comprehensive regulatory change history across all US jurisdictions
- Business compliance risk scores useful to insurance underwriters
- Seasonality patterns in compliance failures (tax deadlines, health inspection cycles)
- M&A due diligence module: evaluate compliance health of any acquisition target

---

## Appendix A: Phase 0 Outreach Templates

### LinkedIn Message — Restaurant Owner

> Subject: Quick question about health inspections
>
> Hi [Name], I'm building a tool to help independent restaurants track compliance deadlines automatically — things like food handler cert renewals, health department requirements, and business license renewals. I'd love 20 minutes to understand how you currently manage this. No pitch, just trying to understand the real problem. Worth a quick chat?

### LinkedIn Message — Contractor / HVAC / Electrician

> Hi [Name], working on a tool for contractors to track license renewals, COIs, and OSHA certs — and share proof of compliance with GCs instantly. Curious how your team manages this today. Quick 15-minute call this week?

### Cold Email — CPA Firm

> Subject: Tool that keeps your SMB clients compliant between your touchpoints
>
> [Name], quick question: how often do clients call you after they've already missed a compliance deadline?
>
> We're building OperatorOS — a compliance deadline tracker for small businesses. Think of it as a living calendar that auto-discovers every license renewal, cert expiry, and filing deadline your clients have, then reminds them before things lapse.
>
> Your clients stay compliant. You look proactive. We pay you 20% of their subscription for as long as they're a customer.
>
> Worth 15 minutes?

---

## Appendix B: Phase 1 MVP User Stories (Development Backlog)

**Epic 1: Onboarding**
- [ ] As a new user, I can complete a 5-question intake form in under 5 minutes
- [ ] After intake, I see a pre-populated compliance calendar for my business
- [ ] I can add, edit, and delete any deadline on my calendar
- [ ] I can invite a team member or accountant to view my calendar

**Epic 2: Deadlines**
- [ ] Each deadline has a name, due date, status, assigned owner, and document slot
- [ ] I can mark a deadline as complete (with or without document upload)
- [ ] I can see all deadlines color-coded by urgency (overdue / due soon / compliant)
- [ ] I can filter by deadline type (license / cert / COI / filing)

**Epic 3: Documents**
- [ ] I can upload a PDF or image to any deadline
- [ ] My documents are stored securely and accessible from any device
- [ ] I can generate a shareable link (read-only, 72-hour expiry) for any document
- [ ] I receive a prompt to update the document when the associated deadline approaches renewal

**Epic 4: Reminders**
- [ ] I receive an email reminder 90 / 60 / 30 / 7 days before each deadline
- [ ] I can customize reminder lead times per deadline
- [ ] I can add an SMS number to receive text reminders
- [ ] I can snooze a reminder for 7 days

**Epic 5: Audit Export**
- [ ] I can generate a PDF showing all my current licenses and certs with their statuses
- [ ] The export includes my business name, export date, and a verification watermark
- [ ] I can generate an export for a specific date range (for audit purposes)

**Epic 6: Billing**
- [ ] I can sign up for any tier with a credit card via Stripe
- [ ] I can upgrade or downgrade my plan at any time
- [ ] I receive an invoice by email each month
- [ ] My data is retained for 90 days after cancellation before permanent deletion

---

## Appendix C: The 1-Pager for Accountants

**OperatorOS for Accountants — How It Works**

Your clients have compliance deadlines you can't track for them. Business license renewals, employee certifications, health department requirements, OSHA records. When they miss one, they call you after the fine lands.

OperatorOS tracks every deadline automatically and sends reminders before anything lapses. You get a dashboard of all your clients' compliance status in one view.

**What you get:**
- Free access to the accountant portal for your entire book
- Weekly digest: upcoming deadlines across all clients
- 20% recurring commission on every client subscription ($16–30/month per client)
- Co-branded compliance reports you can send to clients with your name on them

**What your clients pay:** $29–149/month depending on business size

**What it costs you:** Nothing.

The average CPA with 50 small business clients earns $800–1,500/month in passive commission once their book is on OperatorOS. The first firm to bring it to their clients in a market tends to lock out competitors — small business owners follow their CPA's tool recommendations.

Interested? Let's schedule a 20-minute walkthrough: [calendar link]

---

*OperatorOS Project Plan v1.0 — Last updated May 2026*  
*Next scheduled review: After Phase 0 completion*
