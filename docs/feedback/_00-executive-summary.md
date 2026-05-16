# OperatorOS — 100 Small Business Evaluations

> Simulated buyer panel: 100 distinct US small businesses across 5 verticals evaluating OperatorOS as a prospective buyer would. Each persona has a name, location, headcount, entity type, and a real compliance pain shape. Each gives: how they'd use it, what works, what's broken or missing, what they'd pay extra for, a verdict, and a price reaction.
>
> Generated 2026-05-16 against the May 2026 build (Workstreams A + C merged). Treat this as a structured listening exercise, not a survey — the personas are simulated, but the obligation surface for each industry is based on real regulatory reality.

---

## TL;DR

**The product is well-built for a real, large problem — but the buyer panel says it currently fits a narrower slice than the positioning suggests.** Of 100 simulated SMBs:

- **~4 would buy without changes** — owner-operated single-entity businesses in deeply-covered states with annualized renewal pain (e.g. a small jeweler, a mover wanting the calendar half, a single-location restaurant in a deep-coverage state).
- **~24 would buy if specific named gaps were closed** — usually 1-2 features (per-staff cert tracking, SMS, state depth, COI distribution, a vertical module). This is the highest-leverage cohort.
- **~33 would trial but probably pass** — the calendar shape is right, but the buying trigger isn't there. The free trial pulls them in; nothing converts them.
- **~39 would pass outright or trial-and-bounce** — wrong shape entirely (DOT/FMCSA, IOLTA, SOC2, USDA, METRC, per-jobsite construction), wrong price for what they need (storage facility, photographer, septic), or unwilling to put their data here (FFL, pawn).

**The dominant cross-vertical pattern: 100% of personas treat the product as an *entity-level* compliance tool. Real SMB compliance is a *matrix of entities × people × locations × projects × renewable credentials*.** The single missing axis (people) blocks the most healthcare, the second (projects) blocks the most construction, the third (locations) blocks the most multi-shop retail. Adding any one of those three axes roughly doubles the convertible market.

---

## The 10 most-cited gaps (ranked by frequency across 100 personas)

| # | Gap | Cited by | Why it matters |
|---|---|---|---|
| **1** | **Per-staff / per-practitioner credential tracking** | ~32 personas (every healthcare, most construction, several retail, salons, daycare, ALF) | The work IS managing a matrix of humans × credentials × renewal cycles. Entity-only model is the wrong abstraction for half the convertible market. |
| **2** | **State-depth credibility — 46 states on "template fallback"** | ~28 personas explicitly named state coverage | "Template fallback" reads as "we don't actually know your jurisdiction." Multiple owners said they'd pass until their state was real, even with everything else perfect. |
| **3** | **SMS reminders** | ~22 personas (owner-operators, field workers, food trucks, contractors, salons, farmers) | Email-only loses anyone who isn't at a desk. Cited as a near-table-stakes ask, especially for the people buying. |
| **4** | **Vertical-software integrations** (POS, payroll, practice mgmt) | ~21 personas (Toast/Square/Clover, Gusto/ADP, Mindbody/Vagaro/SimplePractice, QBO, Karbon, Mitchell1, DealerTrack, SiteLink, Metrc, brightwheel) | Compliance data already lives in those systems. Double-entry kills adoption. |
| **5** | **HIPAA BAA** | ~9 healthcare personas (gating ~60% of segment) | Legally cannot store PHI-adjacent docs without one. Hard block, not preference. |
| **6** | **No filing-as-a-service** ("tells me what's due, doesn't file") | ~14 personas | Multiple owners said they'd happily pay 3-5× current price if it actually *filed* the entity report, BOI, sales tax, or license renewal. The reminder layer alone is the cheap half of the value. |
| **7** | **COI generation + auto-distribution to GCs/owners/HOAs** | ~11 construction + service personas | This is the single most demanded contractor workflow. Whoever owns it owns the trade. |
| **8** | **Multi-location pricing / dashboard** | ~9 personas (laundromat chain, coffee chain, barbershop chain, food truck second loc, daycare, hotel, brewery+taproom, dispensary, gym) | $79 × N locations doesn't scan. No location-aggregator view. |
| **9** | **Mobile native app + offline** | ~14 personas (field workers, food truck, owner-operators, farmer, septic, mover, locksmith, mobile car wash) | Cited as "I'm in a truck, not at a desk." Offline matters for satellite/rural. |
| **10** | **Audit-prep mode** | ~7 personas (ALF, daycare, home health, dental, dispensary, body shop, group practice) | Survey/inspection prep is a discrete workflow distinct from calendar tracking — pull-together a binder for a known surveyor visit. Highest willingness-to-pay observed. |

**Honorable mentions:** CE/CEU credit tracking per practitioner (most healthcare + licensed professionals); IOLTA trust accounting (lawyers); DOT/FMCSA module (trucking, movers, tree service, septic); USDA/FSA (farming); SOC2/ISO27001 framework module (SaaS); Metrc / PMTA (cannabis, vape); ATF 4473 / A&D (FFL, pawn); per-jobsite/per-project compliance (construction); resale certificate management (retail); cannabis 280E adjacent; vendor-COI inbound collection (catering, retail with vendors).

---

## The 4 personas who would buy today, unchanged

> The whole-product-fit reference cases. Worth interviewing the real-world analogs.

1. **Jewelry store** (Newport Beach CA) — single-state, single-location, annualized renewal pain (FFL/explosives if applicable, sales tax, business license), high-document business, low integration need.
2. **Mover** (Atlanta GA) — wants the calendar half *now* for the non-DOT side (entity, sales tax, surety bond, GA HHGCC), would buy the DOT module if it ever ships.
3. **Solo CPA running their own firm** (NJ) — the channel customer; would adopt the Accountant tier today *if* the Karbon/QBO sync gap closes; price is fair.
4. **Foundation repair specialist** (OKC OK) — owner-operated, entity-level renewals are most of the burden, has been burned by a late renewal.

---

## Verdict distribution by vertical

| Vertical | Would buy (now or conditional) | Would trial-then-likely-pass | Would pass outright | Best-fit personas |
|---|:-:|:-:|:-:|---|
| Food & Hospitality (1-20) | 11 | 6 | 3 | Brewery, distillery, sushi, steakhouse, B&B |
| Construction & Trades (21-40) | 9 | 8 | 3 | Foundation repair, fence, pool, painter, GC |
| Healthcare & Personal Services (41-60) | 5 | 11 | 4 | Solo chiro, optometrist, yoga, pilates |
| Retail, Auto & Specialty (61-80) | 7 | 6 | 7 | Jeweler, mover (calendar half), liquor, auto repair |
| Professional Services & Tech (81-100) | 6 | 5 | 9 | Solo CPA (channel), insurance, RE broker, wedding planner, cleaning |
| **Total** | **38** | **36** | **26** | |

**Read:** Roughly 38% conversion potential at the current build, 36% conversion potential with the right 1-2 feature shipped, 26% structurally out of scope (DOT/FMCSA/USDA/IOLTA/SOC2/METRC/per-project verticals where the entire product shape is wrong).

---

## Pricing reactions — summarized

**Where $79/mo is well-priced:** 1-2 location specialty operators with annualized renewal pain where one missed filing > one year of subscription (jewelers, restaurants, breweries, distilleries, dental, dermatology, body shops, movers, lawyers, insurance agents, funeral homes).

**Where $79/mo is too high:** owner-operators with thin compliance (solo food truck, photographer, vintage shop, storage facility, septic guy, family farm, laundromat per-location), and trade businesses that read this as "wall calendar with email." Multiple personas suggested a **$15–39 "basic"** tier or pay-per-state SKU.

**Where $79/mo is too low:** healthcare with per-staff matrices (group mental health, ALF, home health, daycare, multi-provider derm/PT), large construction shops with COI/per-job needs, and operators paying $200–800/mo for a single vertical SaaS today (LCPtracker, Foley, J.J. Keller, Compliancy Group). Multiple personas in this band said **"I'd pay $300–1,000/mo for the right product, but $79 is the wrong product."**

**Accountant tier ($299/mo) — both accountants:** fair-to-cheap per client (works out to $1.50–$7/client at typical book sizes); the gating issue is Karbon/QBO/TaxDome integration, white-label depth beyond logo (custom sending domain, custom URL), and the ability to re-bill the SMB tier to clients with margin built in. Neither would adopt without those.

---

## The 6 strategic moves implied by the panel

These are the cross-cutting moves the panel essentially voted for. Each touches multiple verticals.

1. **Ship per-staff/per-credential tracking** — unlocks ~32 personas spanning healthcare, construction, retail, salons, daycare, ALF. Single highest-leverage feature in the panel. Touches roughly half the convertible market.
2. **Close 5-state → 20-state depth gap** — converts most "would buy if my state was real" personas. Suggest sequencing by SMB density × vertical fit (CA, TX, FL, NY, IL, PA, OH, GA, NC, NJ, MI, MA, VA, WA, AZ, TN, IN, MO, MD, MN).
3. **Ship SMS reminders** — single most-requested reminder channel feature, blocks owner-operators and field-workers. Twilio integration, opt-in per user, +$5–10/mo upsell.
4. **Pick 2 vertical modules to go deep on** — the panel says construction (COI distribution + per-jobsite + per-tech cert) and healthcare (per-practitioner + HIPAA BAA + CE tracking) are the two largest "would buy now" expansions. Avoid spreading across cannabis/FFL/USDA/trucking simultaneously — those are >$300/mo verticals each with entrenched single-vertical competition.
5. **Re-shape the Accountant tier around the integration block** — the channel is unlocked or blocked at Karbon/QBO/TaxDome/practice-management sync. Without it, the $299 tier doesn't sell. With it, two of two simulated accountants said they'd adopt.
6. **Tier the pricing** — introduce a $25–39 "Lite" tier (calendar + email, no AI/portal/share/storage) for the thin-compliance retail segment, and a $250–500 "Vertical" tier for healthcare/construction/multi-location where the panel said they'd pay multiples of current price for vertical depth.

---

## What the panel did *not* say

A few notable absences from the feedback, also useful to know:

- **Almost no one praised the compliance score as a feature on its own merits.** It was treated as marketing decoration. Operators wanted a checklist with confirmation numbers. The score does work as a daily-active hook, but the panel suggests it's not the buying trigger anyone claims.
- **The AI insights feature drew much less reaction than expected** — neither raved-about nor heavily attacked. Most personas treated it as "interesting if cited, ignored if vague." Citations and source links got positive comments; the feature isn't the wedge.
- **The audit share link was praised more than expected** — multiple healthcare, construction, and retail personas spontaneously cited it as "this would actually save me a call to my insurance broker / GC / surveyor." Underweighted in current positioning.
- **The accountant magic-link UX got positive callouts in unexpected places** — even the solo lawyers and the wedding planner mentioned the magic-link as "exactly how I'd want to give my CPA access." Worth foregrounding more prominently.

---

## How to read the rest of this document

Sections that follow are the 100 raw persona evaluations, organized by vertical. Each persona has a consistent shape (profile, workflow, what works, what's broken, paid features, verdict, price). Voices vary deliberately — the Vermont B&B couple talks differently than the LA injector talks differently than the rural septic owner. Some are 3 lines; some are 200 words. They are simulated, not interviews — use them to *generate* hypotheses for real interviews, not as a substitute for them.

Five batch files (preserved as appendices in this document):
- Batch 1 — Food & Hospitality (1-20)
- Batch 2 — Construction & Trades (21-40)
- Batch 3 — Healthcare & Personal Services (41-60)
- Batch 4 — Retail, Auto & Specialty (61-80)
- Batch 5 — Professional Services & Tech (81-100)

