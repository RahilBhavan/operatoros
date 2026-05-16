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

# Batch 1 — Food & Hospitality (Businesses 1-20)

### #1 — Trattoria Caruso, Queens NY
**Owner:** Gianna Caruso, owner-operator (2nd generation)
**Profile:** Italian restaurant, 12 staff, S-corp, NYC DOH grading + SLA liquor renewal + sidewalk café permit pain.

**How I'd actually use this:** I'd set it up on Sunday afternoon during prep, then probably never open the app again unless I get an email. My bookkeeper Marisol would be the one in there weekly checking off filings. The audit share link is what I'd send my insurance broker when they ask for proof of workers' comp every January.

**What works for me:**
- The T-30/T-7/T-1 cadence actually matches how my brain works — I forgot SLA renewal one year and it cost me $2,300 in fines
- AI flagging obligations is genuinely useful — I had no idea I needed a separate NYC commercial recycling certification until my health inspector mentioned it offhand
- Document attach per deadline is smart, I currently have a shoebox of paper certificates

**What's broken or missing for me:**
- No NYC DOH grade tracking? That's the single most important compliance event in my life. If I drop to a B I lose 30% of my dinner covers for a week.
- No integration with Toast (my POS) means I'm still manually pulling sales tax numbers
- No sidewalk café permit reminder — that's a NYC DCWP thing and you probably don't have it
- Liquor license renewal in NY is a nightmare with community board notifications — does your "template fallback" actually know the 30-day public notice rule?
- I can read English fine but my line cooks can't — no Spanish/Italian language option

**Features I'd pay extra for:**
- A "health inspection prep" checklist with photo upload, ideally vetted by an ex-inspector
- SMS reminders to me personally on T-1, because email goes into the void during service

**Verdict:** Would trial, would buy if NYC-specific coverage existed
**Price reaction:** $79 is fine, less than I pay my linen service.

---

### #2 — Big Tex Tacos, Austin TX
**Owner:** Marcus Reyes, owner + sole operator
**Profile:** Solo food truck, 1 prep cook, sole prop, Travis County mobile food permit + TABC if I ever do events.

**How I'd actually use this:** Honestly? I wouldn't sit at a laptop. I run my whole business off my phone between prep and lunch service. If I can't get an SMS at 7am telling me "your commissary permit expires Friday," this is dead to me.

**What works for me:**
- Auto-discovery sounds nice in theory
- Free trial without a credit card is the right call for someone like me

**What's broken or missing for me:**
- No mobile app. I will never log into a web dashboard. Disqualifying.
- No SMS reminders. Email = invisible. Texts = I read them.
- $79/mo is a third of my insurance premium. For someone running solo, that's a lot for what is essentially a fancy calendar.
- Austin's mobile vendor rules are weirdly hyperlocal — commissary requirements, fire suppression on the truck, propane tank inspection — none of that is going to be in a "template fallback"
- Doesn't help me with the actual filing, just tells me to do it. I already know I have to do it. I need someone to do it.

**Features I'd pay extra for:**
- A "do my sales tax for me" add-on. I'd pay $50/mo for that alone.
- WhatsApp reminders (a lot of my food truck friends use WhatsApp groups for permit gossip)

**Verdict:** Would pass at this price, would maybe trial at $19/mo for solo operators
**Price reaction:** Too expensive for what I get. Build a $19 solo tier.

---

### #3 — Steelhead Brewing Co., Portland OR
**Owner:** Dana Whitlock, co-founder & head of ops
**Profile:** Craft brewery + taproom, 22 staff, LLC, TTB-regulated, OLCC + Multnomah County health + federal excise.

**How I'd actually use this:** This is the kind of thing my ops coordinator Becca would live in. She already manages a spreadsheet with 47 recurring deadlines. If your auto-discovery actually catches TTB Form 5130.9 monthly excise plus the OLCC quarterly server permit roster updates, you save her about 6 hours a month.

**What works for me:**
- Source citations on AI insights — I actually trust this if you're citing TTB.gov rather than hallucinating
- Accountant portal — our CPA Greg handles 4 other breweries, he would actually pay $299 for this
- Audit share link concept — our distributor compliance team asks for proof of TTB Brewer's Notice annually

**What's broken or missing for me:**
- Does the "template fallback" actually handle TTB? Because federal excise filing cadence depends on annual production volume tier (we file quarterly, sub-100k bbl). If you don't know that nuance you'll generate wrong reminders and that's worse than no reminders.
- No e-signature for OLCC server permits is a real gap
- Beer release ATF/COLA label approvals aren't a "deadline" but they're a compliance thing — would be cool to track approval pipeline
- No integration with Ekos or Beer30 (brewery management systems) means double data entry
- TTB has its own portal (Pay.gov) — your tool doesn't file there, so I still need someone who knows TTB

**Features I'd pay extra for:**
- TTB Brewer's Report of Operations (BROP) prep workflow with the actual form pre-filled from our production data
- COLA tracking with bonded warehouse status
- Multi-location support if/when we open our second taproom

**Verdict:** Would trial, would buy if TTB coverage is real (not template)
**Price reaction:** $79 is cheap if it works. $299 for our CPA is also cheap if it actually saves Greg time across his book.

---

### #4 — Carved Coffee, Seattle WA
**Owner:** Priya Chen, founder/CEO
**Profile:** 3-location specialty coffee, 18 staff, S-corp, WA L&I + Seattle minimum wage compliance + retail food permits per location.

**How I'd actually use this:** I'd set it up once and assign each location to a different team lead so they own their site's compliance. My GM Tariq would have a portfolio view across all three. The compliance score would go on our monthly leadership dashboard.

**What works for me:**
- The 0-100 compliance score is the kind of metric I can actually put in a board update
- Document versioning per deadline is good — health permits get reissued and we lose the old ones
- Multi-tenant feel — I'm assuming each location can be siloed

**What's broken or missing for me:**
- "Multi-location dashboard" is literally listed as a gap. That's a dealbreaker for me. I am 3 locations today, planning 5 by end of year.
- Seattle has secure scheduling ordinance, paid sick & safe time, minimum wage tier rules — that's compliance, not a "deadline." Your model is too deadline-shaped.
- No Gusto / Rippling / Justworks integration. Half my compliance is payroll-driven.
- Doesn't track team training certs (food handler cards expire per employee in WA)
- No "what changed" diff when a regulation updates — I want to know if the rule changed, not just that the deadline is the same

**Features I'd pay extra for:**
- Employee-level cert tracking (food handler, alcohol server)
- Multi-location rollup with per-site scoring
- Seattle/King County rule subscriptions specifically

**Verdict:** Would trial, would pass without multi-location
**Price reaction:** $79 × 3 locations would be steep. Need a multi-loc plan.

---

### #5 — Rosehip Bakery, Chicago IL
**Owner:** Anna Kowalski, owner & head baker
**Profile:** Retail bakery + wholesale to 8 grocery accounts, 14 staff, LLC, IL Dept of Public Health + Chicago BACP + wholesale food processor license.

**How I'd actually use this:** I'd use it Sunday nights when I do paperwork. My problem is I have retail compliance (storefront permits, sidewalk signage) plus wholesale compliance (process authority letters, allergen labeling, FSMA preventive controls) and they're totally different worlds. I need both tracked.

**What works for me:**
- Email reminders are fine for me, I'm in front of a screen Sundays
- AI flagging unknown obligations — yes please, FSMA scope creep is real
- Accountant portal — my bookkeeper would actually use this

**What's broken or missing for me:**
- IL is one of the 46 "template fallback" states. So I'm getting a generic experience while the demo customer in California gets the real thing? Hard sell.
- No FSMA / FDA / allergen rule coverage that I can see — that's the core of my wholesale risk
- No way to track per-customer COI requirements (Whole Foods wants different docs than Mariano's)
- No bulk doc collection — when grocery buyers do audits they ask for 14 documents at once
- The "5 team members" cap is fine for me but my pastry chef and morning lead would both want access

**Features I'd pay extra for:**
- Per-wholesale-customer document packets (COI, allergen statement, process authority letter, third-party audit)
- FSMA preventive controls reminder workflow
- Recall plan template

**Verdict:** Would trial, would buy when IL coverage is real and FSMA exists
**Price reaction:** $79 is fair if the IL coverage is real. Not fair for a template.

---

### #6 — Heirloom Catering Co., Boston MA
**Owner:** Devon Mwangi, owner & exec chef
**Profile:** Off-premise catering, 9 staff + 30 1099 servers, LLC, MA DPH catering license + per-event ABCC one-day liquor permits + MWBE cert renewal.

**How I'd actually use this:** I'd use it for the recurring annual stuff. My real headache is per-event compliance — every wedding I cater needs a separate one-day liquor permit filed with the town, plus a venue COI rider, plus sometimes a tent permit. Your tool is built for recurring deadlines, not event-driven.

**What works for me:**
- MWBE certification renewal tracking would be useful (5-year MA recert)
- COI document storage per client
- Accountant view — my CPA handles 3 other catering companies

**What's broken or missing for me:**
- Event-driven workflow doesn't exist. I do 80 events a year, each with their own mini compliance checklist.
- No 1099 contractor compliance tracking (servers, bartenders — I need their TIPS cert on file)
- No integration with Tripleseat or Total Party Planner (catering CRMs)
- MA ABCC one-day permits are filed at the town clerk level — your template fallback won't know that
- Doesn't help with vendor-side COI requests from venues

**Features I'd pay extra for:**
- Per-event compliance template (one-day liquor, tent, food, COI rider)
- 1099 contractor cert vault
- MWBE/WBENC/DBE renewal management

**Verdict:** Would pass — wrong shape of tool for event-driven catering
**Price reaction:** $79 is fine if it solved my real problem, which it doesn't.

---

### #7 — Carbonic, San Francisco CA
**Owner:** Theo Lindqvist, owner & somm
**Profile:** Natural wine bar, 6 staff, LLC, CA ABC Type 42 license + SF health + SF Mandate Living Wage + Prop 65 signage.

**How I'd actually use this:** Probably twice a year, honestly. I'm a 6-person wine bar. My compliance burden is low but the consequences are high — losing my ABC license would end me. So I want a tool I can ignore 350 days a year and trust on the 15 days that matter.

**What works for me:**
- CA is one of the 5 deep-coverage states, so I'd get a real product
- ABC license renewal at T-30 with the actual fee amount would be golden
- Audit share link for my landlord (they audit annually for permit compliance)

**What's broken or missing for me:**
- SF-specific things — Health Care Security Ordinance, Fair Chance Ordinance, Mandate Living Wage — these aren't "deadlines" they're ongoing compliance postures
- No Prop 65 signage / labeling tracker
- No way to record actual filings — I want to mark "filed, here's the confirmation number" not just "complete"
- Don't see anything about CalSavers retirement mandate
- The compliance score feels like vanity metric, I don't need a number, I need certainty

**Features I'd pay extra for:**
- ABC license sub-categories (Type 41 vs 42 vs 47 vs 48) with the actual rules per type
- Annual ABC renewal fee + LLBA reminder
- SF ordinance posture dashboard

**Verdict:** Would trial, would buy if SF/CA depth is real
**Price reaction:** $79 is reasonable insurance. I pay more for my wine fridge service.

---

### #8 — Coco's Frozen, Miami FL
**Owner:** Coco Alvarez, owner
**Profile:** Seasonal ice cream parlor, 4 staff in winter / 10 in summer, sole prop → LLC, FL DBPR food service + Miami-Dade county + sales tax.

**How I'd actually use this:** Maybe sign in once a quarter? I'm seasonal so half my compliance is dormant. The big thing for me is hiring all those summer kids — I-9s, work permits for minors, food handler cards, all at once.

**What works for me:**
- Free trial without card is good for someone who's price-skeptical
- Email reminders work for me

**What's broken or missing for me:**
- No seasonal/intermittent business mode — I don't need summer staff reminders in February
- No minor work permit tracking (FL CSL-1A for under-18 employees)
- No I-9 / E-Verify workflow
- Florida is template fallback — would I even get real DBPR coverage?
- Bilingual interface would matter for my Cuban-American staff

**Features I'd pay extra for:**
- Minor employment compliance bundle (FL is strict on hours/breaks for under-16s)
- I-9 storage with re-verification reminders
- Spanish UI

**Verdict:** Would pass at full price, would trial if there's a seasonal/small tier
**Price reaction:** $79 × 12 = $948 to manage maybe 6 deadlines. Math doesn't work.

---

### #9 — Brand Kitchen Collective, Los Angeles CA
**Owner:** Justin Park, founder
**Profile:** Ghost kitchen running 4 virtual restaurant brands out of 1 commissary, 11 staff, LLC, LA County health + 4 separate DBA registrations + 4 sets of marketplace contracts.

**How I'd actually use this:** I'd use it daily-ish. I have 4 brands, each with its own DBA, sales tax permit, marketplace agreement (DoorDash, UberEats, Grubhub, ezCater). The administrative weight per "restaurant" is the same whether it has 1 customer or 1000, so I drown in paperwork.

**What works for me:**
- LA County is in CA so I'd get real coverage
- Audit share link for landlord and marketplace platforms
- Compliance score per brand would be useful for prioritization

**What's broken or missing for me:**
- Can I create 4 entities under one account? Or do I need 4 subscriptions at $79 each? That's $316/mo for what is operationally 1 business.
- No marketplace contract / DBA tracking
- No tracking of the new LA "ghost kitchen" disclosure rules (we have to disclose the physical address now)
- Doesn't help with food safety scoring across 4 menu concepts in 1 kitchen
- No Karbon/QBO integration means my bookkeeper still copies everything manually

**Features I'd pay extra for:**
- Multi-brand / multi-DBA single-entity mode
- Marketplace agreement tracker
- POS integration with Otter (ghost kitchen aggregator)

**Verdict:** Would trial, would buy if multi-brand pricing makes sense
**Price reaction:** $79 for one brand is fine, $316 for four is a no.

---

### #10 — Maple Hollow Inn, rural Vermont
**Owner:** Eleanor & Frank Whitmore, owners (husband-wife)
**Profile:** 5-room B&B, 2 part-time housekeepers, sole prop, VT DOH lodging + meals & rooms tax + town short-term rental registration.

**How I'd actually use this:** Frank handles the books. He's 68 and not technical. If it doesn't email him a plain-language reminder, it doesn't exist. I (Eleanor) handle the property — I wouldn't touch this.

**What works for me:**
- Email reminders, plain English
- A simple list of what's coming up

**What's broken or missing for me:**
- VT is template fallback — we'd basically get a generic calendar
- "AI-flagged obligations" sounds intimidating, not helpful
- Compliance score is meaningless to a 5-room B&B
- No tracking of state meals & rooms tax filing (quarterly in VT, 9% rate)
- We're a side business — I make more from my pottery — and we already use a paper calendar that works

**Features I'd pay extra for:**
- Nothing, honestly. This isn't built for us.

**Verdict:** Would pass
**Price reaction:** $79/mo is more than our entire monthly utility bill. Not happening.

---

### #11 — The Battery House, Charleston SC
**Owner:** Margaux Saint-Cloud, GM
**Profile:** 24-room boutique hotel, 19 staff, LLC, SC DHEC + hospitality tax + accommodations tax + ADA + state hotel license.

**How I'd actually use this:** I'd put my front office manager Reece in charge of it. We'd review the dashboard during Monday ops meetings. The audit share link would be for our liability insurer and our PE owner's annual compliance review.

**What works for me:**
- Audit share link with revocation is actually valuable for an insurer review
- Compliance score format works for ownership reporting upward
- Accountant portal because we use an outsourced CFO

**What's broken or missing for me:**
- SC is template fallback. We're SC-specific (state and local accommodations tax cadence is very particular).
- No ADA compliance posture (this is HUGE for hotels — pool lifts, room ratios, signage)
- No PCI compliance tracking (we take cards, we have PCI obligations)
- No life safety / fire marshal inspection cadence
- No integration with Mews or Cloudbeds (our PMS) — no cross-reference of occupancy data with tax filings
- Owner-side wants "what would an OSHA visit find" not "what's due next month"

**Features I'd pay extra for:**
- ADA posture audit
- PCI DSS SAQ tracking
- Fire marshal / life safety calendar

**Verdict:** Would trial, would pass without SC depth + ADA
**Price reaction:** $79 is cheap for a hotel. We spend more on toilet paper.

---

### #12 — The Stable at Belle Meade, Nashville TN
**Owner:** Whitney Booker, owner
**Profile:** Wedding/event venue, 7 staff, LLC, TN ABC special-event permits + TDH food + ASCAP/BMI music licenses + capacity certificate.

**How I'd actually use this:** Wedding venues are weird — we have annual stuff (music license renewal, ABC, fire) and per-event stuff (COI from caterers, special event liquor). Same shape problem as the catering guy in Boston.

**What works for me:**
- ASCAP/BMI tracking if you do it
- COI receipt tracking per event vendor

**What's broken or missing for me:**
- No event-driven workflow
- No vendor COI collection portal (I currently chase caterers for COIs every single event)
- TN ABC special event permits aren't really "deadlines" they're applications
- No Honeybook or Aisle Planner integration (wedding industry tools)
- TN is template fallback

**Features I'd pay extra for:**
- Vendor COI collection inbox (each caterer/florist/photographer auto-prompted to upload)
- ASCAP/BMI renewal with rate calc
- Capacity certificate / fire marshal tracker

**Verdict:** Would trial, would buy if vendor COI collection existed
**Price reaction:** $79 is fine, but I'd want the COI portal at this price.

---

### #13 — Mahalo Sushi, Honolulu HI
**Owner:** Kenji Tanaka, owner & sushi chef
**Profile:** Sushi restaurant w/ full bar, 15 staff, S-corp, HI DOH food + HI Liquor Commission + GET (general excise tax) monthly + ServSafe + sushi-specific HACCP plan.

**How I'd actually use this:** I do my own books at night. I'd check this Sunday nights. My wife Akiko runs FOH and might use it for liquor license stuff.

**What works for me:**
- Document storage for ServSafe certs (8 of my staff need them)
- Liquor license renewal reminders if accurate
- AI flagging — would love to know what I'm missing

**What's broken or missing for me:**
- HI is template fallback. Hawaii GET is NOT sales tax — different mechanics, different cadence (monthly vs. quarterly thresholds). If you treat it generically you'll mislead me.
- HACCP plans for sushi (raw fish handling) are state-required — no tracker
- Liquor Commission in Honolulu has weird hyperlocal rules about hours of operation, no template will catch
- No POS integration (I use Square) means I'm doing GET tax math manually still
- No Japanese language UI — half my staff would prefer it

**Features I'd pay extra for:**
- Sushi-specific HACCP review reminders
- HI GET tax filing prep
- Multilingual UI (Japanese, Tagalog)

**Verdict:** Would pass until HI is properly covered
**Price reaction:** $79 ok but not for template-quality coverage.

---

### #14 — Verdant, Denver CO
**Owner:** Sasha Goldberg, founder
**Profile:** Plant-based fast-casual, 8 staff, expanding to second location Q3, LLC, CO DOR sales tax + Denver health + state retail food + commissary if expanding.

**How I'd actually use this:** I'm in growth mode. Compliance is a thing I want to systematize NOW before I have 2 locations and the chaos doubles. I'd use this as the backbone of a "compliance ops" SOP.

**What works for me:**
- CO might be in the deep-coverage states? Worth checking
- The 0-100 score format works for me, I think in dashboards
- AI flagging obligations is exactly the "unknown unknowns" problem I'm trying to solve before location 2

**What's broken or missing for me:**
- Multi-location dashboard is a stated gap — and I need that in 90 days
- No SOP/runbook templating — I want to translate "deadline" into "task assigned to person X"
- No team training cert vault
- No connection to Gusto (where my employee data lives)
- Compliance score doesn't tell me what to actually DO to improve it

**Features I'd pay extra for:**
- Multi-location with shared template
- Task assignment per deadline (with role-based, not just user-based)
- Score improvement playbook ("your score is 78 — here are the 4 tasks to get to 90")

**Verdict:** Would trial, would buy if multi-location ships by August
**Price reaction:** $79 is fine for now, will need multi-loc pricing soon.

---

### #15 — Burnett & Bone, Dallas TX
**Owner:** Dale Burnett, owner
**Profile:** Independent steakhouse, 28 staff, full bar, LLC, TABC + Dallas County health + sales tax + mixed beverage tax (TX is special) + DOL.

**How I'd actually use this:** I'm 62, I don't log into anything. My controller Lupe handles all compliance and she lives in QuickBooks. If this doesn't sync with QBO I will never adopt it.

**What works for me:**
- Audit share link — my insurer asks for a packet every year, this saves Lupe a day
- AI insights might be useful for catching new DOL stuff (overtime rules keep changing)

**What's broken or missing for me:**
- No QBO integration is stated. Lupe's life is QBO. Dealbreaker.
- TX mixed beverage gross receipts tax (6.7%) AND mixed beverage sales tax (8.25%) is its own special hell — generic "sales tax" tracker won't work
- No TABC certification tracking per employee (every server who pours alcohol needs TABC cert in TX)
- No tip credit / tipped wage compliance posture (FLSA stuff, DOL is making moves)
- Compliance score is meaningless to Lupe — she wants a checklist

**Features I'd pay extra for:**
- QBO integration with automated tax filing tracking
- TABC server cert vault
- Tip credit compliance dashboard

**Verdict:** Would pass without QBO integration
**Price reaction:** $79 cheap, but irrelevant if Lupe won't use it.

---

### #16 — Vinnie's Pizza, Phoenix AZ
**Owner:** Vinnie Marchetti, owner-operator
**Profile:** Independent pizza shop, 10 staff, DoorDash + UberEats delivery, LLC, Maricopa health + AZ TPT + city privilege tax + food handler cards.

**How I'd actually use this:** Honestly I'd forget I had it. I check email twice a day. I'm in the shop 70 hours a week. If you don't text me I will miss it.

**What works for me:**
- The price isn't insane
- Document storage if simple enough

**What's broken or missing for me:**
- No SMS reminders. I will not see emails on T-1.
- AZ TPT (transaction privilege tax) is filed with the state AND the city in Phoenix. Two different filings. Template fallback won't catch.
- No DoorDash/UberEats 1099-K reconciliation help — that's my biggest tax pain
- Maricopa County health inspector grade tracking would matter
- No food handler card per-employee tracker (AZ requires within 30 days of hire)

**Features I'd pay extra for:**
- SMS reminders
- Employee food handler card vault with hire-date countdown
- Marketplace 1099-K reconciliation

**Verdict:** Would trial, would buy with SMS
**Price reaction:** $79 acceptable.

---

### #17 — Pour Decisions Bartending, Las Vegas NV
**Owner:** Jordan Vasquez, owner
**Profile:** Mobile bartending for weddings, 3 staff + 8 1099 bartenders, LLC, NV biz license + per-county catering permits + 1099 management.

**How I'd actually use this:** I work out of my truck and a small office. I bid 4-6 weddings a week, each one in a different jurisdiction. Compliance is per-gig.

**What works for me:**
- Document attach for COIs and TAM cards
- Audit share link for venues that ask for proof

**What's broken or missing for me:**
- Event-driven, not deadline-driven — wrong shape (same problem the catering and venue people flagged)
- 1099 contractor management is half my admin and you don't touch it
- NV TAM cards (alcohol awareness) expire per bartender — no tracker
- Per-county catering permits in NV (Clark, Washoe, etc.) — wildly different — template won't catch
- No Joist/HoneyBook integration

**Features I'd pay extra for:**
- 1099 contractor cert vault
- Per-event compliance template
- TAM card per-employee tracker with expiry

**Verdict:** Would pass
**Price reaction:** $79 ok if the tool fit. It doesn't.

---

### #18 — Bluegrass Spirits Co., Lexington KY
**Owner:** Hollis Tatum, COO
**Profile:** Craft distillery, 16 staff, S-corp, TTB DSP + KY ABC + federal excise + bottled-in-bond + bonded warehouse + age statement compliance.

**How I'd actually use this:** Our ops manager Pete would live in it. Distillery compliance is brutal — TTB, KY ABC, COLAs, monthly excise, warehouse bond renewals, age statements per SKU. We currently use a custom Airtable that I'd love to retire.

**What works for me:**
- AI source citations to TTB.gov — IF accurate, this is gold
- Accountant portfolio view — our CPA does 3 other distilleries
- Document versioning for COLAs (these update with every label change)

**What's broken or missing for me:**
- TTB depth — same question as the brewery guy. DSP compliance is more complex than brewery. If your "template fallback" handles distilleries, I don't trust it.
- No bonded warehouse inventory tracking (this is required, separately)
- No COLA pipeline tracker
- No age-statement compliance per SKU
- No state ABC variance handling (KY rules differ from TN differ from VA)
- Can't file anything via Pay.gov directly

**Features I'd pay extra for:**
- TTB DSP-specific compliance bundle (separate product, would pay $200/mo)
- COLA approval pipeline
- Bonded warehouse inventory reconciliation reminders

**Verdict:** Would trial, would buy if TTB DSP coverage is real & cited
**Price reaction:** $79 is shockingly cheap if it actually covers distillery. Suspicious it doesn't.

---

### #19 — Sown & Sown, Madison WI
**Owner:** Iris Halvorsen, chef-owner
**Profile:** Farm-to-table restaurant + 1-acre on-site garden, 13 staff, LLC, WI DATCP + WI DOR sales tax + on-site produce growing (separate state rules) + occasional value-added (jams, preserves).

**How I'd actually use this:** Sunday morning planning. I do my own admin. My main pain is that I straddle two regulatory worlds — restaurant compliance AND small-farm/processor compliance for our garden produce and house-made preserves.

**What works for me:**
- AI flagging obligations — I genuinely don't know what I'm missing on the processor side
- Document attach for organic certs, food safety modernization act records

**What's broken or missing for me:**
- WI is template fallback
- No farm/cottage food / on-site agriculture coverage
- No PCQI (preventive controls qualified individual) tracking for our preserves
- No way to record the "we sell value-added jams" exemption boundaries
- The "5 team members" cap is fine but I want my farm manager Mateo and my sous chef and my bookkeeper all to have separate views

**Features I'd pay extra for:**
- Farm-to-table / value-added producer compliance bundle
- Organic certification renewal tracker
- Cottage food law boundary calculator (am I still exempt?)

**Verdict:** Would trial, would buy if WI + farm coverage existed
**Price reaction:** $79 is fair if the depth is real.

---

### #20 — Westmoreland Diner, Pittsburgh PA
**Owner:** Tony Rusciolelli, owner (3rd generation)
**Profile:** 24-hour diner, 21 staff across 3 shifts, S-corp, Allegheny County health + PA LCB liquor (we have beer) + PA DOR + city payroll + OSHA (24hr ops).

**How I'd actually use this:** I'd never log in. My daughter Gina handles the books on Tuesdays. She'd be the user. She's 34 and tech-comfortable.

**What works for me:**
- Email reminders for the 6-7 things we actually have to renew yearly
- Document attach for our PA LCB license

**What's broken or missing for me:**
- PA is template fallback
- 24-hour operations have unique OSHA/wage&hour stuff (shift differential, meal breaks across midnight) — generic templates won't catch
- Allegheny County health has its own inspection cadence not state-level
- No payroll integration — Gina uses ADP and would still do everything twice
- The compliance score is something Gina wouldn't care about, she wants a list

**Features I'd pay extra for:**
- ADP integration
- 24-hour ops compliance bundle (shift differentials, meal break rules)
- Allegheny-specific health inspector cadence

**Verdict:** Would trial for free, would probably pass at $79
**Price reaction:** $79 is steep for what's basically a checklist for a diner.

---

## Patterns across food & hospitality

A few recurring themes from this batch:

1. **Event-driven vs deadline-driven mismatch.** Catering, wedding venues, and mobile bartending all said the same thing: their compliance is per-event, not per-quarter. The tool's calendar-shaped mental model doesn't fit ~20% of hospitality.
2. **State-coverage credibility gap is severe.** 16 of 20 personas are in template-fallback states. Multiple owners explicitly said they'd pass until their state was real. "Template fallback" reads as "we don't know your jurisdiction" — worse than nothing for high-stakes compliance.
3. **SMS is table stakes for owner-operators.** Food trucks, pizza shops, diners, B&Bs — anyone in-shop 60+ hrs/week — said email reminders will be missed and SMS is non-negotiable.
4. **POS/payroll integration repeatedly named as dealbreaker.** Toast, Square, Gusto, ADP, QBO came up across 8+ personas. Compliance data lives in those systems; double-entry kills adoption.
5. **Per-employee cert tracking is a hole.** Food handler cards, ServSafe, TABC, TAM, TIPS — every state has them, every operator manages them, no one wants to track them in spreadsheets.
6. **TTB/alcohol depth is a make-or-break for brewery + distillery.** They'd pay much more than $79 IF the depth is real and cited. They'd pass instantly if it's template.
7. **Multi-location pricing is unresolved.** $79 × N locations doesn't scan to anyone with 2+ sites.
8. **Compliance score feels like vanity to most operators.** They want a checklist with confirmation numbers, not a number out of 100.
# Batch 2 — Construction & Trades (Businesses 21-40)

### #21 — Marchetti Brothers Remodeling, Montclair NJ
**Owner:** Dom Marchetti, owner-operator
**Profile:** Residential GC, 14 staff, S-corp, juggling NJ HIC renewal + lead-paint RRP on every pre-1978 home + permit closeouts across 3 townships

**How I'd actually use this:** I'd set it up Sunday night, get the trial running, and then probably my office manager Linda lives in it. She's the one who chases the COIs and the permit closeouts. I'd want a dashboard on my phone showing red items only. Maybe I check it Friday afternoons when I'm doing payroll.

**What works for me:**
- The T-30/T-7/T-1 email cadence is exactly how my brain works. I miss things at T-30 because I'm on a roof, but T-7 is when I panic.
- Document attach per deadline is good. Right now my HIC renewal cert is in a Gmail thread from 2023.
- Score is a nice gut check. I'd brag about 100 to my insurance guy.

**What's broken or missing for me:**
- No permit closeout tracking integrated with Montclair, Bloomfield, or Verona portals. That's 80% of my actual compliance pain. Knowing "permit closeout due" without knowing WHICH job site is useless.
- No COI generation or distribution. Every GC and homeowner association asks me for a new COI named to them. I pay my agent $50 a pop. If you did that, I'd pay you double.
- No per-job tracking. Compliance for me isn't entity-level, it's job-level. Where's the multi-project view?
- NJ is one of the 5 deep-coverage states, you say? Prove it. Show me you know about the NJ Contractors Registration Act, not just generic templates.
- Lien release deadlines? Mechanics lien windows in NJ are 90 days. Where's that?

**Features I'd pay extra for:**
- COI request + auto-distribution to GC and homeowner
- Per-job permit + inspection tracker tied to township portals
- Lien deadline tracker per job

**Verdict:** Would trial, would buy if you ship per-job tracking
**Price reaction:** $79 is nothing. I lose $79 in an afternoon if I forget an inspection.

---

### #22 — Sparks Electric Services, Atlanta GA
**Owner:** Marcus Sparks, master electrician + owner
**Profile:** Residential + light commercial electrical, 6 staff, LLC, GA state EC license + city of Atlanta business license + low-voltage endorsements

**How I'd actually use this:** Honestly I'd probably forget about it after week one unless it nags me. My wife does the books. She'd be the user. I'd see the score in a weekly email and either ignore it or call her about it.

**What works for me:**
- Auto-populating GA state EC license renewal — yes please, mine snuck up last cycle and I paid the late fee.
- Email reminders. I don't need an app, I need email.
- Magic-link for my accountant. He'd love that, he's old school.

**What's broken or missing for me:**
- No per-electrician license tracking. I have 4 journeymen and 1 apprentice. Each one has a state card with its own expiry. If you don't track those, this isn't a tool for an electrical company, it's a tool for an LLC.
- No CE hours tracking. GA requires continuing ed for license renewal. Where does that live?
- No truck/van DOT tracking. I run 5 vehicles over 10K GVWR, I have IFTA and IRP to deal with.
- I don't see anything for OSHA 10/30 cert expiry for crew.

**Features I'd pay extra for:**
- Per-employee license + CE tracking with their own email reminders
- DOT / vehicle compliance bundle

**Verdict:** Would pass at current scope. Would trial if crew-level cert tracking ships.
**Price reaction:** $79 is fair if it covered crew certs. For just the entity stuff? Too much. I can put 4 dates in my Google Calendar for free.

---

### #23 — Bayou City Plumbing & Drain, Houston TX
**Owner:** Theresa Nguyen, operations partner
**Profile:** Plumbing, 11 staff, S-corp, 24/7 emergency, TX RMP license + city of Houston + backflow tester certs + medical gas endorsement on 2 techs

**How I'd actually use this:** Office runs it. I'd want it on the wall TV in the dispatch room. Compliance score visible. Anything red gets handled that day. I check it before our Monday standup.

**What works for me:**
- TX is a deep-coverage state, you say. Good. The TX state plumbing board is a nightmare and if you actually know the RMP renewal cadence and the apprentice-to-master ratio rules I'd be impressed.
- Audit share link for our commercial GCs is interesting. They ask us for compliance packets all the time.
- The AI flagging "obligations you might be missing" — yes, because I find out about new rules by accident.

**What's broken or missing for me:**
- Per-tech licensing. Plumbing in Texas is licensed at the individual level. RMP, Master, Journeyman, Tradesman, Apprentice. Every one of my 11 has a card. Without that, you're useless to a plumbing shop.
- Backflow tester certs are a separate registration with TCEQ. Annual.
- Medical gas installer cert for 2 of my guys — ASSE 6010. Renews every 3 years.
- No on-call rotation or after-hours dispatch context. (I get that's not your job, but Compliance OS that doesn't know plumbing is licensed per-person isn't compliance OS.)

**Features I'd pay extra for:**
- Per-employee TX state plumbing card tracking
- Backflow & medical gas cert bundle

**Verdict:** Would buy if crew-level cert tracking exists. Otherwise pass.
**Price reaction:** $79 is cheap, that's not the issue. The issue is what it covers.

---

### #24 — Desert Sun HVAC, Phoenix AZ
**Owner:** Ray Calderón, GM
**Profile:** Residential + light commercial HVAC, 19 staff, LLC, AZ ROC dual license (C-39 + C-40) + EPA 608 on every tech + R-410A/R-454B refrigerant handling

**How I'd actually use this:** I'd assign this to my office admin and she'd ping me when something turns red. We have an ops huddle every Tuesday, this would be a slide.

**What works for me:**
- ROC license renewal is a real deadline I've eaten a fine on. Auto-populating that is genuinely useful.
- Document versioning for our surety bond, our W/C cert, our GL — those get requested by builders constantly.
- AZ being a deep-coverage state matters here. If you actually know the ROC bond renewal cadence and dual-license rules, you've earned the trial.

**What's broken or missing for me:**
- EPA 608 universal cards for 19 techs. Where is that?
- No NATE cert tracking. We use NATE for hiring leverage, customers care.
- New refrigerant rules under EPA's AIM Act in 2026 — has your AI flagged anything? Because that's a huge deal for HVAC right now.
- No integration with ServiceTitan or Housecall Pro where my dispatch + tech credentials actually live.

**Features I'd pay extra for:**
- EPA 608 per-tech tracking with renewal reminders
- AIM Act / refrigerant transition advisory

**Verdict:** Would trial. Would buy if it knows AIM Act + per-tech 608 tracking.
**Price reaction:** $79/mo is a rounding error against one ROC fine.

---

### #25 — North Star Roofing, Minneapolis MN
**Owner:** Pete Eriksen, owner
**Profile:** Residential + light commercial roofing, 22 staff in season / 8 in winter, S-corp, MN residential roofing license + heavy seasonal hiring

**How I'd actually use this:** Office manager owns it. I look at it in March when we're spinning back up for the season. May through October I'm too busy to look at anything.

**What works for me:**
- MN residential roofer license renewal is real. We had a scare last March. Auto-tracking that is good.
- Compliance score for insurance audits — our W/C audit is brutal because we go 8 → 22 → 8 in headcount across the year.
- Audit share link is nice for insurance and for big property managers who do annual vendor reviews.

**What's broken or missing for me:**
- MN isn't on your deep-coverage list, I'm guessing. So I'm getting template fallback. That's not good enough.
- Seasonal hiring compliance is a whole world — I-9 reverifications, ACA hours, W/C class code shifts. Where's that?
- OSHA fall protection cert tracking per crew? Nothing.
- Manufacturer cert (GAF Master Elite, Owens Corning Preferred) — those are real renewals with real revenue impact and you don't know about them.
- No storm-chaser / out-of-state contractor compliance for when we follow hail east.

**Features I'd pay extra for:**
- Seasonal workforce compliance pack (I-9 reverification, W/C class shifts)
- Manufacturer certification tracking

**Verdict:** Would pass until MN gets deep coverage.
**Price reaction:** $79 is fine if the product actually knows my state. It doesn't.

---

### #26 — Carolina Greenscapes, Charlotte NC
**Owner:** Diego Martínez, founder
**Profile:** Commercial landscaping, 31 staff (majority H-2B seasonal), LLC, NC pesticide applicator license + H-2B program + DOL prevailing wage

**How I'd actually use this:** This is for my comptroller. I personally would not touch this. She runs payroll, immigration, and labor compliance and she is drowning.

**What works for me:**
- A compliance calendar that includes pesticide applicator renewal is helpful. NC requires CEUs.
- Document versioning is genuinely useful for our DOL audits — they ask for 3 years of payroll, I-9s, H-2B certs.
- The accountant portal is interesting because we use an outside CPA for H-2B wage compliance.

**What's broken or missing for me:**
- H-2B is the entire ballgame for me and I see nothing. Petition filing windows (Jan 1 + Jul 3), prevailing wage determinations, recruitment timelines, certified payroll. If this doesn't speak H-2B, it's not for me.
- Per-applicator pesticide license tracking — I have 6 licensed applicators across 31 people.
- DBE/MBE certification renewals — we hold MBE in NC and we bid municipal work.
- Davis-Bacon certified payroll on our public-sector jobs.
- No worker safety training tracking (heat illness, equipment-specific).

**Features I'd pay extra for:**
- H-2B compliance calendar with petition windows
- Certified payroll generation (this alone would be $500/mo)

**Verdict:** Would pass. Wrong shape for an H-2B-heavy crew shop.
**Price reaction:** $79 is laughable for what we need. I'd pay $500-1000/mo for the right tool.

---

### #27 — Tampa Bay Pools, Tampa FL
**Owner:** Jerry Polanski, owner
**Profile:** Pool installation + service, 9 staff, LLC, FL CPC (certified pool contractor) license + county-specific permits + DBPR

**How I'd actually use this:** I'd set it up myself, then probably never look at it. My wife handles the office. She'd get the emails.

**What works for me:**
- DBPR CPC license tracking is good. Mine renews biennially and I've never had a clean reminder.
- Compliance score for the bank when we refinance the warehouse.
- Free trial no card is the right call. I've been burned by SaaS trials too many times.

**What's broken or missing for me:**
- FL is probably template fallback. So you're missing the actual quirks of DBPR and the county-by-county pool permit world (Hillsborough vs Pinellas vs Pasco all do it differently).
- VGB Act / Pool & Spa Safety Act compliance — we deal with this on every install.
- No per-county permit tracking and pool permits in FL are county-level.
- No subcontractor COI collection. I use 3-4 subs (plaster, deck, screen) and they need to give me COIs naming me additional insured.

**Features I'd pay extra for:**
- Subcontractor COI collection portal
- County permit calendar by jurisdiction

**Verdict:** Would trial, lean toward pass unless FL gets deep coverage.
**Price reaction:** $79 is fine. I'd pay it if it worked.

---

### #28 — High Country Painting, Denver CO
**Owner:** Kelly Ortega, owner-operator
**Profile:** Residential painting, 7 staff, LLC, CO doesn't license painters (no state license) + EPA RRP for pre-1978 + Denver business license

**How I'd actually use this:** I'd set it up, glance at the score, then check it monthly. I don't have an office manager, it's me.

**What works for me:**
- EPA RRP cert renewal — that's a 5-year renewal and I forgot the year. If this catches that, sold.
- Email reminders. I don't want another app.
- Honestly the simplicity is appealing. I don't need the sophisticated stuff a 30-person shop needs.

**What's broken or missing for me:**
- CO doesn't have a state contractor license for painters. Does your auto-populate know that or does it invent a fake one? Big trust issue.
- Per-employee RRP certified renovator cards — I have 3 RRP certified painters. Those are individual.
- Lead-safe work practices documentation per job (test kits, containment photos) — that's actual RRP compliance and you don't do it.
- No mobile app means I won't use it from a job site.

**Features I'd pay extra for:**
- RRP per-job documentation workflow
- Per-employee RRP renovator card tracking

**Verdict:** Would trial. Verdict depends on whether it correctly knows CO has no painter license.
**Price reaction:** $79 is at the upper end of what I'd pay solo. $39 would be a no-brainer.

---

### #29 — SunDirect Solar, San Diego CA
**Owner:** Anika Reddy, COO
**Profile:** Residential + commercial solar installer, 24 staff, S-corp, CA C-46 (Solar) + C-10 (Electrical) + NABCEP PV Installation Professional certs + CSLB bond

**How I'd actually use this:** I'd own it as COO. I'd want it integrated with our project ops view. I'd review it weekly with our compliance officer.

**What works for me:**
- CSLB license renewal + bond renewal cadence is real pain. Auto-populating that is genuinely valuable.
- CA being a deep-coverage state matters. If you know CSLB, workers comp class code 5183, and the prevailing wage filings for our public-sector solar jobs, you're useful.
- Document versioning is genuinely good for us — we get audited by every utility we interconnect with.

**What's broken or missing for me:**
- NABCEP cert tracking per installer. I have 6 NABCEP-certified installers. Renewals are 3-year cycles with CE hours. Where is this?
- Title 24 / Rule 21 / SGIP / interconnection paperwork — those aren't deadlines but they ARE compliance and the AI insights better catch them.
- DAS (Disadvantaged Business Status) — we hold WBE in CA.
- No integration with Aurora or Enphase Enlighten where our actual project compliance evidence lives.
- The new CA balcony solar rules (SB-49) — has your AI surfaced them? Because if not, your "AI insights" are not insightful.

**Features I'd pay extra for:**
- Per-installer NABCEP + CE hour tracking
- Interconnection / utility paperwork tracker

**Verdict:** Would buy at base price. Would pay 2-3x with NABCEP per-installer tracking.
**Price reaction:** $79 is criminally underpriced for what you're claiming to do. Charge more, do more.

---

### #30 — Wasatch Concrete Co, Salt Lake City UT
**Owner:** Brent Holladay, owner
**Profile:** Commercial concrete (foundations, flatwork, tilt-up), 17 staff, S-corp, UT B100 GC + concrete subspecialty + UDOT prequalification for state work

**How I'd actually use this:** Office manager runs it. I want the green/red light on Monday morning. That's it.

**What works for me:**
- UT contractor license renewal — that's a hard date with real teeth. Good.
- Audit share link for GCs — we work for 4-5 big GCs who run annual vendor compliance audits. This would save us hours.
- Compliance score for prequalification renewals (UDOT, big private GCs).

**What's broken or missing for me:**
- UT is probably template fallback. I bet you don't know about the UT contractor license bond requirements or the specific subspecialty rules.
- UDOT prequalification renewal is annual and has specific requirements (financial statements, safety records, equipment list). Not on your radar.
- DBE on federally-funded work, MBE on city work.
- Concrete supplier certifications — ACI certs for my finishers. 5-year cycle, individual cards.
- NPDES stormwater permits per job site, and SWPPP documentation. Critical for commercial concrete.

**Features I'd pay extra for:**
- SWPPP / NPDES per-jobsite tracking
- UDOT/state DOT prequalification calendar

**Verdict:** Would trial, lean pass without UT deep coverage.
**Price reaction:** $79 is fine. Not the gating issue.

---

### #31 — Lake Erie Windows & Doors, Cleveland OH
**Owner:** Frank Kowalski, owner
**Profile:** Window/door installation, 8 staff, LLC, OH doesn't license home improvement at state level but Cleveland + suburbs do + EPA RRP

**How I'd actually use this:** Me and my bookkeeper. She'd handle it day-to-day, I'd see the weekly summary.

**What works for me:**
- Honestly the calendar concept is nice. I run my whole business off my truck and a folder.
- Email reminders that don't require an app — yes.
- Free trial without a card — I'll actually try it.

**What's broken or missing for me:**
- OH has no state contractor license for what I do. So what's it auto-populating? I'm suspicious.
- Per-city license tracking for Cleveland, Lakewood, Westlake, Rocky River, Mayfield Heights — that's where my actual compliance lives.
- Manufacturer cert (Andersen, Pella, Marvin certified installer) — those drive my pricing and they renew.
- EPA RRP renovator certs per installer.
- I work on a lot of historic homes in Lakewood — historic district approvals are a real workflow you don't touch.

**Features I'd pay extra for:**
- Per-city/county license tracker
- Manufacturer installer cert tracking

**Verdict:** Would trial. Probably pass after trial unless OH gets real coverage.
**Price reaction:** $79 feels rich for what I do. $39-49 is my sweet spot.

---

### #32 — Hoosier Drywall Co, Indianapolis IN
**Owner:** Travis Beckman, owner
**Profile:** Commercial drywall sub, 38 workers (3 W-2 / 35 1099 crews), LLC, IN doesn't license drywall + heavy 1099 compliance + workers comp audits

**How I'd actually use this:** Bookkeeper. I'd never touch this myself. She's drowning in 1099 paperwork and W/C audits.

**What works for me:**
- W/C audit prep is a real recurring pain. Anything that organizes documents helps.
- Compliance score is a useful gut check for the GCs we sub for.
- Stripe billing means I don't have to deal with invoicing.

**What's broken or missing for me:**
- 1099 vs W-2 classification compliance — that's my biggest legal exposure and you don't touch it. New IRS classification rules in 2026 make this a 5-alarm fire.
- W-9 collection + 1099 filing workflow for 35 crews. That's literally my entire administrative nightmare and you don't help.
- Per-crew COI collection (each 1099 crew is supposed to carry their own GL + W/C). I chase these constantly.
- Certified payroll on prevailing-wage public school work. We do a lot of that.
- IN doesn't license drywall at state level — does your auto-populate know that?

**Features I'd pay extra for:**
- 1099 contractor COI + W-9 collection portal
- 1099 vs W-2 classification audit tool

**Verdict:** Would pass at current scope. Would buy if you nail 1099/sub compliance.
**Price reaction:** $79 is fine. The product is wrong-shaped for my business, not over-priced.

---

### #33 — Pine Coast Tree & Arbor, Portland ME
**Owner:** Sam Whitcomb, owner / ISA certified arborist
**Profile:** Tree service, 5 staff, LLC, ME doesn't license arborists at state level but ISA cert is the credential + EAB quarantine zones + pesticide app license

**How I'd actually use this:** It's just me running the business. I'd check it once a week from my phone, probably Sunday night.

**What works for me:**
- ISA cert renewal reminder would be useful — that's CEU-based and easy to forget.
- Maine state pesticide applicator license renewal — same.
- A score I can show to my insurance guy at renewal.

**What's broken or missing for me:**
- ME isn't deep coverage, so I'm getting template stuff. For 5 staff that's probably fine but I have no way to verify.
- DOT compliance for my chip truck + log truck — they're over 10K GVWR. Hours of service, medical cards, IFTA on the log truck.
- EAB (emerald ash borer) quarantine zones — Maine has rules on moving wood. Compliance-adjacent but real.
- TCIA accreditation renewal if I ever pursue it.
- No mobile app. I'm in the field 6 days a week.

**Features I'd pay extra for:**
- DOT/FMCSA compliance bundle for my trucks
- Mobile app with photo evidence per job

**Verdict:** Would trial. Probably pass — too much overhead for 5 staff at $79.
**Price reaction:** $79 is steep for a 5-person shop. I'd pay $29 happily.

---

### #34 — Iron Mountain Excavation, Birmingham AL
**Owner:** Cole Dabney, owner
**Profile:** Site excavation, 12 staff, S-corp, AL general contractor license + NPDES stormwater + utility locate compliance + dump truck DOT

**How I'd actually use this:** Office gal handles it. I want her to ping me on red items only.

**What works for me:**
- AL general contractor license renewal is real. They are not forgiving on lapses.
- Compliance score as a quick sanity check.
- The accountant portal — my CPA holds my hand on a lot of this.

**What's broken or missing for me:**
- AL is template fallback I'm assuming. So you don't really know the AL Licensing Board's quirks.
- NPDES Construction General Permit per jobsite + SWPPP inspections (weekly + rain events) — this is the single biggest compliance burden for excavation and you don't touch it.
- 811 / dig safe compliance documentation per job.
- DOT for my dump trucks — CDL renewals for drivers, medical cards, vehicle inspections, IFTA fuel tax.
- Asbestos awareness for my crews if we hit old buried pipe.

**Features I'd pay extra for:**
- SWPPP per-jobsite inspection logger
- DOT / CDL fleet compliance bundle

**Verdict:** Would pass. Excavation compliance lives in per-jobsite + per-driver land, not entity land.
**Price reaction:** $79 is cheap, but it doesn't matter if the product doesn't do my work.

---

### #35 — Saguaro Fence Co, Tucson AZ
**Owner:** Mike Beltrán, owner
**Profile:** Fence installation, 6 staff, LLC, AZ ROC license (C-13 fencing) + city of Tucson business license + ROC bond

**How I'd actually use this:** Me, weekly, from my truck. I have no office staff.

**What works for me:**
- ROC license + bond renewals. I have eaten a late fee on the bond before. Annoying.
- Auto-discovery — I'm not even fully sure what I'm supposed to track. If the AI tells me "you might be missing X," that's the value.
- Free trial no card. Good.
- AZ deep coverage matters here. If you know ROC, you've earned a look.

**What's broken or missing for me:**
- 811 Arizona Blue Stake compliance per job — every fence post needs a locate.
- HOA / community approval workflows — half my jobs need HOA approval before I can dig.
- Per-installer OSHA 10 — I have 6 guys, all should have OSHA 10.
- Mobile app. Again, I have no desk.
- ROC complaint tracking. If a customer files an ROC complaint, that's a real deadline-driven response.

**Features I'd pay extra for:**
- 811 dig ticket tracker per job
- Mobile-first interface

**Verdict:** Would trial. Verdict depends on whether AZ coverage feels real.
**Price reaction:** $79 is at the high end for 6 staff. Would prefer $49.

---

### #36 — Gateway Floors, St Louis MO
**Owner:** Anthony "Tony" Petrelli, owner
**Profile:** Flooring installation (hardwood, LVP, tile), 9 staff, LLC, MO doesn't license flooring + city + commercial general contractor relationships

**How I'd actually use this:** My daughter does the books part-time, she'd use it. I'd see a weekly summary.

**What works for me:**
- The accountant portal — my CPA would actually log in.
- Document versioning for COI requests. Every commercial GC asks for a fresh one named to them.
- Score is nice. I'd put it on the wall.

**What's broken or missing for me:**
- MO doesn't have a state license for flooring. Make sure the auto-populate isn't making one up.
- COI auto-distribution — this is THE pain. My agent charges $25/cert and takes 2 days.
- St Louis city + St Louis county + St Charles county business licenses — that's the actual compliance, not state-level.
- Workers comp class code (5538 carpet/floor installation) audit prep.
- Manufacturer certifications (Shaw, Mohawk, Bona) — those tie into warranty pricing.

**Features I'd pay extra for:**
- COI auto-distribution (huge)
- Multi-county license tracker

**Verdict:** Would trial. Would buy with COI distribution.
**Price reaction:** $79 is fine.

---

### #37 — Sooner Foundation Specialists, Oklahoma City OK
**Owner:** Kayla Bryant, COO
**Profile:** Foundation repair + waterproofing, 15 staff, S-corp, OK CIB (construction industries board) license + roofer license overlap + lead foreman certs

**How I'd actually use this:** I'm the COO so I'd own it. Daily check during my morning coffee, monthly deep review.

**What works for me:**
- CIB license renewal — yes.
- Compliance score for our bonding company. They want quarterly updates.
- AI insights with citations is the part I trust most. I'm a "show me the source" person.

**What's broken or missing for me:**
- OK isn't deep coverage I'm guessing. So I'm flying on templates.
- Per-foreman certification (lead foreman cert for waterproofing systems — Basement Systems, Supportworks dealer programs).
- Geotech / soils reports per job site — these are compliance-adjacent and need to be on file.
- Surety bond + bonding capacity tracking is critical for us. Tornado season = insurance claim work = need higher bonding.
- COI for HOAs (we work on a lot of HOA-managed properties).

**Features I'd pay extra for:**
- Bonding capacity / surety tracking
- Dealer program cert tracking

**Verdict:** Would trial. Would buy at base, no problem.
**Price reaction:** $79 is fair. I'd pay $150 for white-label client reports (oh wait that's the accountant tier).

---

### #38 — Renaissance Demolition, Detroit MI
**Owner:** DeShawn Brooks, owner
**Profile:** Commercial + selective demolition, 20 staff, S-corp, MI residential builder license + asbestos abatement contractor license + EPA NESHAP + MIOSHA

**How I'd actually use this:** My safety director handles compliance. She'd live in this tool. I'd see her dashboard.

**What works for me:**
- Document versioning is critical. Every demo job has 30+ compliance documents.
- Compliance score for GCs and insurance.
- Audit share link for environmental insurance underwriters — they audit us every renewal.

**What's broken or missing for me:**
- Asbestos compliance is a whole universe and you don't speak it. NESHAP 10-day notification before demo, AHERA, MDEQ notifications, manifest tracking, disposal facility licensure.
- Per-worker asbestos worker / supervisor certs (3-year refresh) — I have 14 certified workers and 3 supervisors.
- Lead worker certs.
- OSHA 10/30 per worker.
- HAZWOPER 40 + 8-hour refresher for crews doing brownfield work.
- MIOSHA is its own thing and the federal OSHA template won't cut it.

**Features I'd pay extra for:**
- Asbestos compliance module (NESHAP, AHERA, per-worker certs) — this alone is worth $200/mo
- Per-worker hazmat cert tracking

**Verdict:** Would pass at current scope. Asbestos demo needs purpose-built compliance, not generic.
**Price reaction:** $79 is cheap for a real product, but yours doesn't cover my work.

---

### #39 — Bay State Masonry, Boston MA
**Owner:** Sean O'Halloran, owner
**Profile:** Masonry (brick, stone, restoration), 11 staff union (BAC Local 3), S-corp, MA HIC + construction supervisor license + prevailing wage + union benefit reporting

**How I'd actually use this:** My office manager Maureen runs it. She handles the union reports and prevailing wage filings. I look at the dashboard maybe monthly.

**What works for me:**
- MA HIC + CSL renewal tracking — yes, both have real teeth.
- Document storage for our restoration project compliance packets (historic district, MHC approvals).
- Score for prequal with universities and hospitals (our main clients).

**What's broken or missing for me:**
- Certified payroll on prevailing wage jobs (LM-21 / WH-347). Every prevailing wage job, every week. This is the single biggest compliance burden of my business.
- Union benefit reporting (BAC local 3) — monthly reporting on hours, pension, H&W. Where is this?
- Apprentice ratio compliance on union jobs.
- Per-mason OSHA 10 + scaffold cert + silica training.
- Boston-specific permits (BPDA approvals, MHC for landmarks work) — those don't fit a template.

**Features I'd pay extra for:**
- Certified payroll generator (this is worth a lot — Points North charges hundreds for this)
- Union benefit reporting bundle

**Verdict:** Would pass. Wrong shape for a union shop with prevailing wage.
**Price reaction:** $79 is laughable next to what LCPtracker or Points North charge. But you don't do what they do.

---

### #40 — Mountain Ridge Septic, Lewistown PA
**Owner:** Earl Ziegler, owner-operator
**Profile:** Septic install + pumping, 4 staff, sole prop, PA DEP sewage enforcement officer relationships + PA septage hauler permit + DOT for pump truck

**How I'd actually use this:** Just me. From my flip phone? Just kidding I have a smartphone now. I'd check email. That's about it.

**What works for me:**
- Honest answer — I'd like a calendar that just tells me when things are due. I'm not modern. My current system is a wall calendar and my wife.
- Email reminders. Good.
- Free trial. Sure, I'll try it.

**What's broken or missing for me:**
- PA septic compliance is COUNTY-level (SEO at the township). State templates won't capture the actual deadlines.
- PA DEP septage hauler permit renewal + manifest tracking.
- PSMA (PA Septage Management Assn) cert — I'm certified, that renews.
- DOT for my pump truck + tank truck. Hours of service, medical card, IFTA.
- The price is high for a 4-person shop that doesn't have an office computer.
- No mobile app. I'm in a truck.

**Features I'd pay extra for:**
- Just plain text SMS reminders honestly
- DOT compliance for the trucks

**Verdict:** Would pass. Too sophisticated, too expensive, too desk-shaped for me.
**Price reaction:** $79/mo is $948/year. For 4 of us, that's real money. I'd want $25-39.

---

## Patterns across construction & trades

The single loudest signal across these 20 is **per-employee credential tracking is table stakes** — electricians, plumbers, HVAC techs, solar installers, masons, demo workers all license at the individual level (or carry individual certs like EPA 608, NABCEP, RRP, OSHA 10/30, asbestos worker, ACI). An entity-only compliance tool reads as half-finished.

Second: **COI generation and auto-distribution** came up over and over. Contractors are constantly chasing certificates of insurance named to specific GCs, homeowners, HOAs, and property managers. Whoever owns that workflow owns the trade.

Third: **per-jobsite compliance dwarfs entity-level compliance** for anyone doing project work — permit closeouts, SWPPP/NPDES inspections, 811 dig tickets, certified payroll, lien deadlines, COI per job. The "compliance calendar" model assumes annualized renewals; construction's pain is per-project.

Fourth: **template fallback for 46 states is a credibility trap.** Several owners (MN roofer, OK foundation, OH window installer, ME arborist) explicitly noted they'd pass without deep state coverage. The product looks generic the moment they probe it.

Fifth: **trade-specific universes (asbestos demo, H-2B landscaping, prevailing wage masonry, 1099-heavy drywall) are too specialized for a horizontal tool.** Those owners will pay 3-5x more for purpose-built tools (Points North, LCPtracker) rather than $79 for generic.

The crowd most likely to convert today: small residential GCs, painters, fence installers, foundation repair, pool — owner-operated shops where the entity-level deadlines really are most of the burden, and the owner has been burned by a late renewal.

File written to `/Users/rahilbhavan/projects/operatoros/docs/feedback/_batch2-construction-trades.md`.
# Batch 3 — Healthcare & Personal Services (Businesses 41-60)

### #41 — Bethesda Family Dental, Bethesda MD
**Owner:** Dr. Priya Mehta, dentist & managing partner
**Profile:** Private dental practice, 7 staff, PLLC, juggling HIPAA + OSHA + MD Board of Dentistry + DEA + malpractice renewals across two providers

**How I'd actually use this:** My office manager Karen would be in this thing daily — she's the one who actually knows when the X-ray equipment inspection is due and when our MD controlled-substance registration renews. I'd want it open on her second monitor with a dashboard of next-30-day items. I'd personally log in once a week to glance at the score and maybe upload my DEA renewal receipt.

**What works for me:**
- The auto-populated calendar pitch is genuinely appealing — right now Karen tracks 40+ recurring items in a color-coded Excel sheet she inherited from the last office manager
- T-30/T-7/T-1 email cascade matches how she already works
- Sharing a read-only audit link with our malpractice carrier at renewal would save her a half-day of PDF assembly

**What's broken or missing for me:**
- No DEA-specific workflow is a real gap — we have one practitioner DEA and one facility DEA, and they renew on different cycles with different fee structures. A generic "license" object doesn't cut it
- No OSHA bloodborne pathogens training tracker — every staff member needs annual training documented, and HHS will ask for it
- No per-practitioner license tracking is the bigger issue: Dr. Chen and I have separate MD dental licenses, separate CE requirements (50 hrs / 2 years), separate malpractice riders. If the system only knows "the business," it's not actually tracking the right entities
- No HIPAA BAA means I literally cannot upload our breach response plan or anything with PHI in the filename to your storage. That's a hard wall
- No integration with Dentrix or our practice management — fine, but means double entry

**Features I'd pay extra for:**
- Per-practitioner license + CE tracker with credit deduction as courses get logged
- HIPAA BAA + breach log workflow
- Bloodborne pathogen / OSHA training matrix

**Verdict:** Would trial, would not buy without BAA and per-practitioner tracking
**Price reaction:** $79 is fine — I pay more for Slack. The features have to actually land though.

---

### #42 — Maple Ridge Veterinary, Wadsworth OH
**Owner:** Dr. Tom Kessler, DVM
**Profile:** Solo rural vet, 4 staff, S-corp, controlled substances + state vet board + USDA accreditation + radiation registration

**How I'd actually use this:** Honestly I'd set it up on a Saturday, get the calendar going, and then probably forget about it until I get the first T-7 email. My tech Sarah handles most paperwork — I'd add her as the second user.

**What works for me:**
- The "you might be missing X" insight from Claude is interesting — I genuinely don't know what I don't know on the Ohio side
- Source citations matter to me. If you tell me I owe something, I want a link to the actual Ohio Veterinary Medical Licensing Board page

**What's broken or missing for me:**
- Ohio is one of your 46 fallback states. So I'm getting generic templates for a profession that's heavily regulated. Not great
- DEA workflow again — I have a Schedule II registration, biennial inventory requirements, 222 forms. None of that is on your radar
- No USDA APHIS accreditation tracking (that's a 3-year recert with required modules)
- No radiation machine registration workflow for ODH
- No integration with AVImark or ezyVet — fine, but I'm already buried in software

**Features I'd pay extra for:**
- Deep Ohio coverage (sounds like you don't have it)
- DEA controlled substance inventory log + 222 form reminders

**Verdict:** Would pass until Ohio coverage is real
**Price reaction:** $79 is reasonable in the abstract. Not for template-fallback content I could get from a state extension office.

---

### #43 — Lakeshore Physical Therapy, Chicago IL
**Owner:** Marcus Holloway, PT, DPT, clinic director
**Profile:** Outpatient PT clinic, 6 staff, LLC, Medicare-enrolled, IL PT licensure + CMS compliance + HIPAA

**How I'd actually use this:** I'd set it up myself and assign deadlines to my office manager Renee. We'd live in this 1-2x per week. The compliance score would be the thing I screenshot for my business partner.

**What works for me:**
- Score is a good forcing function — I'm a metrics guy, and a single number I can move is more motivating than a checklist
- Accountant portal — my CPA charges me by the hour and chasing documents from me is half the bill. If she can pull her own audit link, that's real money saved
- Document versioning per deadline is a small thing but it's the right detail

**What's broken or missing for me:**
- Medicare revalidation (PECOS) is a huge SMB-physician compliance item and it's not anywhere in your description. Every 5 years, plus off-cycle requests
- No HIPAA BAA — same problem as the dentist. I can't put a PHI-adjacent doc in here
- No per-PT license tracking. My 4 PTs each have IL licenses on different renewal cycles with separate CE (40 hrs / 2 years in IL including 1 hr sexual harassment + ethics modules). "Business has a PT license" is the wrong abstraction
- No NPI / CAQH / payer credentialing workflow — that's where the real compliance pain lives for me
- IL is one of your 5 deep-coverage states? If yes great, if not this is mostly template stew

**Features I'd pay extra for:**
- Medicare/Medicaid revalidation tracker
- Per-provider credentialing dashboard (NPI, CAQH attestation, payer enrollment status)

**Verdict:** Would trial, would buy if IL is actually deep + you add credentialing
**Price reaction:** $79 is a steal if it actually works. Could see paying $150 with the right add-ons.

---

### #44 — Sacramento Spine & Wellness, Sacramento CA
**Owner:** Dr. Lila Park, DC
**Profile:** Solo chiropractor + 1 admin, sole prop, CA Board of Chiropractic Examiners + X-ray supervisor cert

**How I'd actually use this:** Set and forget. I want emails. I do not want to log in. If the calendar is right, that's 95% of the value.

**What works for me:**
- Email cadence T-30/T-7/T-1 is exactly the right rhythm
- CA presumably one of your 5 deep states — if so, that's relevant to me

**What's broken or missing for me:**
- No CE tracker — I need 24 hrs every 2 years for CA DC license, and tracking who attended what is genuinely annoying
- No X-ray supervisor / RHB radiation cert tracking
- No malpractice renewal as a first-class object
- SMS reminders absent — I check email maybe 2x a day and a text would actually land

**Features I'd pay extra for:**
- SMS reminders ($5-10/mo easy add)
- CE credit tracker

**Verdict:** Would trial
**Price reaction:** $79 feels rich for a 2-person shop. $39 would feel right.

---

### #45 — Glow Aesthetics LA, Beverly Grove CA
**Owner:** Jasmine Reyes, NP, owner & injector
**Profile:** Medical spa, 6 staff, PC under a supervising MD, CA BRN + medical director agreement + drug supply + cosmetic-specific rules

**How I'd actually use this:** I'd log in weekly. My front desk lead Carla would handle uploads. I really need this for my medical director agreement renewal, my Botox/Allergan account compliance, and my CA BRN multi-site stuff.

**What works for me:**
- AI surfacing obligations I might be missing — med spa regulation is genuinely confusing and varies by what services we add. If you flag that adding microneedling triggers new requirements, that's worth the subscription alone
- Source citations — I will never trust a black box for compliance, but a cited rule I'll trust

**What's broken or missing for me:**
- No tracking of medical director agreement as a separate object (we renew annually, and the supervising MD changed last year)
- No DEA — I dispense some Schedule IV
- No license tracking per provider — my MD, my NP, and any RN injectors all have separate licenses + separate scope-of-practice rules in CA
- No HIPAA BAA — disqualifying for storing intake forms
- No integration with Boulevard or Mangomint (our booking software) — not a dealbreaker but everyone in this industry has one

**Features I'd pay extra for:**
- Med spa-specific rule pack (corporate practice of medicine, medical director, good faith exam requirements)
- Per-provider scope-of-practice tracker

**Verdict:** Would trial, would buy if the med spa rule coverage is real
**Price reaction:** $79 is nothing. I'd pay $200 for a real med spa compliance tool.

---

### #46 — Bodywork Collective, Austin TX
**Owner:** Daniela Ruiz, LMT, owner
**Profile:** Massage therapy studio, 6 LMTs (mix of W-2 and 1099), LLC, TDLR massage establishment + per-therapist license

**How I'd actually use this:** I'd set it up once. Honestly I'd want to add my 6 therapists as light users so they can see their own license renewals.

**What works for me:**
- Compliance score is satisfying — I'm competitive
- Audit link sharing for our landlord (they ask for proof of insurance + license annually)

**What's broken or missing for me:**
- No per-therapist license tracking — this is the whole job for me. TDLR licenses renew every 2 years per LMT, plus CE hours per LMT. If your system can't hold that, it's not for me
- No CE credit ledger
- No establishment license sub-types
- SMS reminders missing — therapists don't check email
- No integration with Mindbody or Vagaro — fine but data lives there

**Features I'd pay extra for:**
- Per-practitioner license + CE module (this should not be an add-on, it should be the core feature)

**Verdict:** Would pass without per-practitioner tracking
**Price reaction:** $79 is fair if it works. Pointless if it doesn't.

---

### #47 — Crown Heights Acupuncture, Brooklyn NY
**Owner:** Wei Chen, LAc
**Profile:** Acupuncture & herbal medicine, 2 LAcs, PLLC, NYSED license + DOH herbal medicine considerations + clean needle cert

**How I'd actually use this:** Login once a month maybe. I want this to be quiet and just send me a heads-up when something is due. I do not want a dashboard. I do not want a score.

**What works for me:**
- Email reminders, clean and simple

**What's broken or missing for me:**
- NY is your deep-coverage state? I hope so, NYSED has its own quirks
- No CE tracking — NYSED requires 60 CE hours every 3 years
- No tracking of clean needle technique cert
- No herbal medicine / supplement compliance — granted this is niche but it's why I'd want a smart AI
- The compliance score is going to stress me out and I'll cancel because of it
- I'd want the email in Mandarin for my partner

**Features I'd pay extra for:**
- Multi-language UI (esp Mandarin, Spanish)
- CE tracker

**Verdict:** Would trial briefly, probably pass
**Price reaction:** $79 is too much for a 2-person practice that wants 90% of features off.

---

### #48 — Boulder Counseling Collective, Boulder CO
**Owner:** Rachel Sterling, LCSW, practice owner
**Profile:** Mental health group practice, 7 clinicians (mix LCSWs and LPCs), PLLC, HIPAA + 7 separate licenses + CE per clinician + telehealth across multiple states + malpractice

**How I'd actually use this:** I'd be the main user. My biller Mateo would have view-only access. I'd be in here weekly because licensing across 7 clinicians + 4 states of telehealth practice is a constant fire.

**What works for me:**
- AI flagging telehealth obligations across states — if you can tell me when WY changed its emergency telehealth waiver, that's enormous value
- Citations to actual state board pages — must-have, you nailed it
- Accountant portal — my CPA would actually use this

**What's broken or missing for me:**
- No per-clinician license tracking is a complete dealbreaker for a group practice. I have 7 humans with separate LCSW/LPC licenses across 4 states with separate CE cycles. This is THE compliance pain. If the product can't model it, the product isn't for group practices
- No CE/CEU tracking per clinician — same point
- No HIPAA BAA — disqualifying. I cannot use this for anything client-adjacent without it
- No telehealth interstate compact tracking (PSYPACT, Counseling Compact)
- No SimplePractice or TherapyNotes integration — that's where the clinical data lives
- No malpractice tracker per clinician

**Features I'd pay extra for:**
- Per-clinician license + CE + telehealth state matrix (this is the killer feature for group mental health)
- HIPAA BAA + breach log

**Verdict:** Would pass today. Would buy v2 if per-clinician is added.
**Price reaction:** $79 for a 7-person practice is cheap. I'd pay $250-400/mo for the right tool. Currently this isn't it.

---

### #49 — Tulsa Vision Care, Tulsa OK
**Owner:** Dr. James Whitfield, OD
**Profile:** Solo OD + 3 staff, PLLC, OK Board of Optometry + glaucoma cert + DEA (limited) + Medicare

**How I'd actually use this:** Probably set it up and check in monthly. My optician handles most renewals already.

**What works for me:**
- Calendar concept — I have like 8 different renewal cycles and they're all in my head
- Audit link for Medicare audits would be useful

**What's broken or missing for me:**
- OK is a fallback state, so I'm getting generic stuff
- No DEA workflow (I have limited Schedule III-V)
- No PECOS Medicare revalidation
- No CE tracker (OK requires 16 hrs/year for OD)
- No glaucoma cert tracking (OK has a separate therapeutic license)

**Features I'd pay extra for:**
- Deep OK coverage
- Medicare PECOS reminders

**Verdict:** Would pass — too much fallback content
**Price reaction:** $79 is acceptable but not for templates I could get free.

---

### #50 — Coastal Dermatology, Miami FL
**Owner:** Dr. Sofia Alvarez, MD, managing partner
**Profile:** Dermatology, 10 staff, PA, accepts insurance + cosmetic services, HIPAA + DEA + FL Board of Medicine + multiple payer credentialing

**How I'd actually use this:** I'd hand this to my practice administrator Brenda. She'd live in it. I'd see the monthly score in our partner meeting.

**What works for me:**
- Accountant portal — yes
- AI insights with citations — yes
- Audit-share for our malpractice carrier and any payer audits — yes

**What's broken or missing for me:**
- Per-provider license tracking absent (2 derms + likely a PA-C eventually, all separate)
- DEA tracking absent (we prescribe accutane, controlled topicals)
- No payer credentialing workflow
- No HIPAA BAA — and we have PHI in literally every document
- No integration with ModMed or Nextech
- Cosmetic side (laser, injectables) has separate FL rules that I bet the generic template misses

**Features I'd pay extra for:**
- Payer credentialing dashboard (this would be worth $500/mo alone for a multi-payer practice)
- Per-provider DEA + license + CE
- HIPAA BAA

**Verdict:** Would trial, would not buy without BAA + per-provider
**Price reaction:** $79 is laughably cheap for what dermatology needs. I'd pay $400-600/mo for the right tool.

---

### #51 — Crown & Co Salon, Atlanta GA
**Owner:** Tasha Williams, owner & stylist
**Profile:** Independent hair salon, 8 booth-rent stylists, LLC, GA cosmetology board + sales tax + fire inspection + business license

**How I'd actually use this:** Maybe once a month. Booth-rent means I don't carry payroll, which simplifies a lot. But I still need to handle establishment license, sales tax, fire marshal, biz license, and I want my stylists to manage their own renewals.

**What works for me:**
- The calendar concept is appealing — right now I have a sticky note on my mirror
- Document storage for my business license + insurance certificate is useful

**What's broken or missing for me:**
- Booth-rent means I have 8 independent contractors with their own cosmetology licenses. I'd want to invite them as light users to manage their own renewals. Doesn't sound like that's a use case you support
- No SMS — stylists are not email people
- No integration with Vagaro or Square Appointments
- City of Atlanta business license has weird quirks; doubt a template catches them
- Compliance score would be skewed by stylist-side items I don't actually own

**Features I'd pay extra for:**
- Free or cheap stylist sub-accounts for their personal license tracking
- SMS

**Verdict:** Would trial, probably pass
**Price reaction:** $79 is fine. $39 with fewer features would be better for me.

---

### #52 — Lotus Nails, Houston TX
**Owner:** Linh Nguyen, owner
**Profile:** Nail salon, 6 nail techs, sole prop, TDLR nail establishment + per-tech license + sanitation + fire code + sales tax

**How I'd actually use this:** Honestly I'd struggle. My English is okay, my husband helps with paperwork. Most of my compliance pain is sanitation inspections from TDLR and the city, and per-tech license renewals. I keep everything in a binder.

**What works for me:**
- If the calendar gets the renewals right that would help
- Document storage in one place is nice

**What's broken or missing for me:**
- No Vietnamese language — most of my industry is Vietnamese-owned and operated. This is a huge missed market for you
- No per-tech license tracking
- No sanitation inspection log / corrective action tracking
- No SMS — I am not on email
- The whole interface assumes I read English compliance jargon

**Features I'd pay extra for:**
- Vietnamese UI
- Per-tech licenses
- Sanitation inspection tracker with photo upload

**Verdict:** Would pass — language barrier, missing per-tech, missing SMS
**Price reaction:** $79 is too expensive for what I'd actually use.

---

### #53 — Sharp Cuts Barbering, Philadelphia PA (3 shops)
**Owner:** Devon Carter, owner
**Profile:** 3 barbershops, 15 barbers (mix booth-rent + W-2), LLC, PA State Board of Barber Examiners + per-shop city licenses + per-barber licenses + sales tax

**How I'd actually use this:** Multi-location is my whole life. I have 3 shops, each with separate Philly business licenses, separate L&I inspections, separate sales tax filings if I track them that way. I need a multi-location view.

**What works for me:**
- Centralized calendar across all 3 shops would be useful
- Accountant portal — my bookkeeper would love it

**What's broken or missing for me:**
- Multi-location support not mentioned anywhere — is this one business per account? Three accounts? Unclear
- Per-barber license tracking absent (15 barbers, each with PA Barber License on 2-year cycles)
- Philly has its own annoying tax/license stack (BIRT, NPT, commercial activity) that I'd expect to be missed
- No SMS
- Booth-rent vs W-2 distinction matters for who's responsible for what

**Features I'd pay extra for:**
- Multi-location with consolidated dashboard
- Per-barber license tracker
- Philly-specific tax pack

**Verdict:** Would trial if multi-location works, otherwise pass
**Price reaction:** $79/mo for 3 locations is a great deal IF one account covers all 3. Three separate accounts is a no.

---

### #54 — Iron & Ink Tattoo, Portland OR
**Owner:** Riley Park, owner & artist
**Profile:** Tattoo & piercing studio, 5 artists, LLC, OR Health Authority licensing + per-artist license + bloodborne pathogen + Multnomah County sanitation

**How I'd actually use this:** I'd set up the calendar and ignore it until I get pinged. My artists each handle their own state licenses but I want a master view.

**What works for me:**
- I like the citation-to-source-agency thing — OHA rules change and I never know
- Audit link sharing — useful for landlord and insurance

**What's broken or missing for me:**
- No per-artist license tracking — OR requires individual tattoo/piercing licenses
- No bloodborne pathogen training tracker (CDC-recommended annually, OR-required)
- No sanitation/sterilization log
- No SMS

**Features I'd pay extra for:**
- BBP training tracker
- Per-artist licenses

**Verdict:** Would trial
**Price reaction:** $79 is okay. Probably wouldn't renew if it didn't replace my spreadsheet.

---

### #55 — Brooklyn Strength Lab, Brooklyn NY
**Owner:** Aaron Cole, owner & trainer
**Profile:** Boutique personal training gym, 4 trainers, LLC, business license + insurance + cert tracking (NASM/ACE) + NYC fitness facility rules

**How I'd actually use this:** Quarterly login. I'm not a heavy compliance shop — biggest things are insurance renewals and trainer cert renewals.

**What works for me:**
- Calendar would consolidate what's currently in 3 different places
- AI suggesting NYC-specific obligations would be useful since I genuinely don't know all of them

**What's broken or missing for me:**
- No personal training cert tracking per trainer (NASM, ACE, NSCA all have separate 2-year recert cycles with CEUs)
- No CPR/AED tracker per trainer
- No Mindbody integration
- Compliance pain is just low for my business type — not sure I need this

**Features I'd pay extra for:**
- Trainer cert + CPR tracker

**Verdict:** Would pass — not enough compliance pain to justify
**Price reaction:** $79/mo for what I actually need is too much.

---

### #56 — Asheville Yoga Sanctuary, Asheville NC
**Owner:** Maya Thornton, owner
**Profile:** Yoga studio, 12 contracted teachers + 1 owner, LLC, business license + insurance + 1099 compliance + sales tax on retail

**How I'd actually use this:** Monthly check-in. Compliance is low for me — main pain is 1099s, sales tax, and insurance.

**What works for me:**
- Calendar for sales tax and 1099 deadlines

**What's broken or missing for me:**
- Yoga Alliance RYT credentials per teacher — would be nice to see at a glance who's current
- No Mindbody integration
- Honestly there's not enough here for a yoga studio

**Features I'd pay extra for:**
- Nothing specific

**Verdict:** Would pass
**Price reaction:** $79 is way too much for the actual compliance load I have.

---

### #57 — Form Pilates, Santa Monica CA
**Owner:** Naomi Brooks, owner
**Profile:** Reformer Pilates studio, 6 instructors, LLC, business license + sales tax + insurance + equipment safety

**How I'd actually use this:** Set and forget. Hand it to my studio manager.

**What works for me:**
- Calendar concept

**What's broken or missing for me:**
- No equipment inspection log (reformers need periodic safety checks)
- No instructor cert tracking (PMA, BASI, STOTT)
- No Mindbody / Pike13 integration
- Santa Monica has its own business license oddities

**Features I'd pay extra for:**
- Instructor cert tracker
- Equipment safety log

**Verdict:** Would pass
**Price reaction:** $79 is more than the value I'd get.

---

### #58 — Little Sprouts Learning Center, Raleigh NC
**Owner:** Crystal Banks, director
**Profile:** Childcare center, 22 staff, 60 kids, nonprofit corp, NC DCDEE license + ratios + background checks per staff + CACFP food program + fire marshal + sanitation + medication admin

**How I'd actually use this:** I would live in this thing daily if it actually solved my problems. Compliance is 30% of my job. I have 22 staff with separate background check cycles, separate health assessments, separate CPR/First Aid, separate professional development hours. I have CACFP claims monthly. Fire drills monthly with documentation. Health inspections quarterly. DCDEE annual recert.

**What works for me:**
- Calendar concept is right
- Document storage per deadline is right
- Audit link would be useful for DCDEE inspector visits

**What's broken or missing for me:**
- No per-staff tracking is a complete dealbreaker — I have 22 humans with 6+ recurring items each. That's the actual job
- No CACFP workflow (monthly meal claims, food service plans, allergen documentation)
- No fire drill log
- No medication administration cert tracking per staff
- No ratio compliance tool (this is daily, not annual)
- No background check renewal tracker per staff (NC requires every 3 years + when staff change roles)
- No DCDEE-specific rule pack — childcare regs in NC are extremely specific and a generic template won't help
- No mobile app — my staff aren't at desks

**Features I'd pay extra for:**
- Per-staff compliance matrix with background check, health, CPR, PD hours
- CACFP meal claim workflow
- Mobile app for daily logs (sign-in/out, meals, incidents)

**Verdict:** Would pass — too much of the actual job is missing
**Price reaction:** $79 is cheap. I'd pay $300-500 for a real childcare compliance platform. There are vertical-specific tools (Procare, brightwheel) that do this; you'd need to beat them.

---

### #59 — Sunshine Home Care, Tampa FL
**Owner:** Marcus Vega, administrator
**Profile:** Home health agency, 35 W-2 caregivers, LLC, FL AHCA home health agency license + ACHC accreditation + per-caregiver background + Level 2 screenings + CEUs + Medicare/Medicaid certification

**How I'd actually use this:** I have a compliance officer (Janelle) who would be the primary user. I'd want it integrated with our HR system but realistic about that — at minimum I need a per-caregiver compliance dashboard.

**What works for me:**
- Calendar for AHCA renewals and Medicare revalidation
- Audit share link for ACHC surveys would be golden

**What's broken or missing for me:**
- Per-caregiver tracking is THE feature for home health and you don't have it. 35 caregivers × 8-10 compliance items each (Level 2 background, TB test, HIV/AIDS training, Alzheimer's training annually, CPR, HHA cert, OIG/SAM exclusion checks monthly, etc.) is the whole job
- No OIG/SAM/Medicaid exclusion monthly check (this is a federal requirement, you can automate it, it would be enormous)
- No ACHC/CHAP/JCAHO accreditation prep workflow
- No payer credentialing
- No HIPAA BAA — disqualifying
- No EVV (electronic visit verification) integration — this is required for Medicaid home health
- FL is one of your 5 deep states? If so, ok. If not, the AHCA-specific rules will be missed
- No background re-screening alerts at the right cadence

**Features I'd pay extra for:**
- OIG/SAM monthly exclusion check automation (this alone is worth $200/mo)
- Per-caregiver compliance matrix
- HIPAA BAA + breach workflow

**Verdict:** Would pass — table stakes for home health are missing
**Price reaction:** $79 is meaningless to me — I'd pay $500-1000/mo for the right tool. But it has to actually do the job.

---

### #60 — Saguaro Senior Living, Tucson AZ
**Owner:** Patricia Holloway, administrator
**Profile:** Small assisted living facility, 14 residents, 12 staff, LLC, AZ DHS assisted living facility license + administrator cert + caregiver training + fire/life safety + medication management + resident assessments

**How I'd actually use this:** Daily during survey prep, monthly otherwise. Compliance is my entire job. I have 12 staff with separate training requirements, my own AZ ALF administrator certification renews, the facility license renews, and AZ DHS surveys happen on no fixed schedule.

**What works for me:**
- Calendar for facility-level renewals
- Audit link would be useful for surveyor visits
- AI flagging obligations — AZ DHS rules are dense and I welcome any help

**What's broken or missing for me:**
- Per-staff tracking absent — 12 caregivers each with fingerprint cards, TB tests, Article 9 training, CPR/First Aid, fall prevention, dementia training, med tech cert. Not optional
- No medication administration record (MAR) workflow — this is the highest-risk thing we do
- No resident assessment / care plan workflow (not your scope, but adjacent)
- No fire drill log per shift
- No admin license CE tracker (I need 12 CE hours/year as AZ ALF administrator)
- No HIPAA BAA
- AZ ALF rules are very specific — generic template won't suffice
- No incident reporting / state notification workflow

**Features I'd pay extra for:**
- Per-staff compliance matrix
- Admin CE tracker
- Survey-prep mode (pulls together the document binder a surveyor will request)

**Verdict:** Would pass for now. Would buy a v2 with per-staff tracking and a survey-prep workflow.
**Price reaction:** $79 is irrelevant — pricing matches the wrong product. The right product would be $300-600/mo and I'd pay it.

---

## Patterns across healthcare & personal services

The single most repeated dealbreaker is **no per-practitioner / per-staff license tracking**. For the dental practice, PT clinic, mental health group, derm clinic, massage studio, salon chain, tattoo studio, daycare, home health agency, and assisted living facility — that's 10 of 20 — the "business has X license" model is the wrong abstraction. Their compliance work IS managing a matrix of humans times credentials times cycles. Without it, the tool is a calendar of facility-level items that's a small fraction of the actual job.

Second pattern: **no HIPAA BAA** disqualifies every healthcare persona (dental, PT, chiro, med spa, derm, mental health, optometry, home health, assisted living). They literally can't store anything PHI-adjacent without one. This is gating ~60% of the segment.

Third: **practice-management integrations** (Dentrix, Mindbody, Vagaro, SimplePractice, ModMed, brightwheel) are expected. Their absence is forgivable but cited repeatedly.

Fourth: **CE/CEU tracking per practitioner** is a near-universal ask in healthcare. Same module solves it for all.

Fifth: **SMS** matters disproportionately for service-industry personas (salon, nail, barbershop, massage, tattoo) where staff don't live in email.

Sixth: **vertical depth beats horizontal breadth**. The childcare, home health, ALF, and group mental health personas would pay 3-5x current pricing for a tool that actually models their world — and would walk away from a generic compliance calendar at any price. The $79 tier is correctly priced for solo/dual-provider shops but leaves enterprise-grade vertical money on the table.
# Batch 4 — Retail, Auto & Specialty (Businesses 61-80)

### #61 — Stitch & Story Boutique, Madison WI
**Owner:** Hannah, owner-operator
**Profile:** Women's apparel boutique, 4 staff, LLC, WI sales tax + annual report are the main pain.

**How I'd actually use this:** I'd set it up once, then mostly ignore it until the email reminders hit my inbox. My bookkeeper would log in monthly to check off filings and upload the WI annual report receipt. I do not want to open a dashboard daily — if the emails work, the product works.

**What works for me:**
- Auto-populated calendar is the only reason I would even try this. I currently track everything in a Google Doc that is, frankly, embarrassing.
- WI is one of your 5 deep-coverage states (you better hope it is), so the deadline list should actually be right.
- Audit share link is genuinely useful — my landlord asks for proof of insurance and licensing every year and I always scramble.

**What's broken or missing for me:**
- No POS integration. I run Shopify POS. If you cannot pull my monthly sales totals to remind me my WI sales tax filing is due *with the number*, you are still half a tool.
- No resale certificate management. I have a folder full of vendor resale certs that expire on different dates — that is real compliance pain you are ignoring.
- No SMS. I do not check email on weekends and my filings are not going to wait.
- AI insights sounds neat but I am skeptical it knows anything about Wisconsin's specific seller's permit rules.

**Features I'd pay extra for:**
- Resale certificate tracker (mine and my vendors').
- Sales tax filing assist that actually pulls Shopify numbers.

**Verdict:** Would trial.
**Price reaction:** $79 is fine if the deadlines are right. If I find one wrong WI deadline in the first week I'm out.

---

### #62 — Elliott Bay Pages & Pour, Seattle WA
**Owner:** Marcus, co-owner
**Profile:** Independent bookstore with a 20-seat cafe, 7 staff, S-corp. WA B&O tax, food service permits, King County health, liquor (beer/wine) license.

**How I'd actually use this:** Honestly, the cafe side is where I bleed time — health inspections, food handler card renewals for staff, beer & wine permit. Books just need the WA annual report. I'd want the calendar to clearly separate "retail" from "food service" obligations because they have different owners on my team.

**What works for me:**
- Compliance score is a nice gut-check. I genuinely do not know if I am at 60 or 95 right now.
- Document attach — I have inspection reports in three different email accounts. Centralizing those is real value.
- Accountant portal — my CPA would love this and might honestly pay for it herself.

**What's broken or missing for me:**
- No individual employee cert tracking. WA food handler cards are per-employee, expire every 2-3 years, and the health inspector asks for them. That is the #1 thing I need and you do not do it.
- No POS / Square integration for B&O tax classification (books are different from prepared food are different from beer).
- WA is not on your deep-coverage list as far as I can tell? Template fallback rules are not going to capture King County health permit cadence.
- No liquor-license-specific tracking (WSLCB renewal, mandatory alcohol server training).

**Features I'd pay extra for:**
- Per-employee certification tracking (food handler, MAST card for alcohol service).
- Health inspection prep checklist.

**Verdict:** Would pass until you do per-employee certs.
**Price reaction:** $79 is reasonable for what you advertise. The problem is the most painful thing isn't in scope.

---

### #63 — Paws & Claws Outfitters, Denver CO
**Owner:** Jenna, owner
**Profile:** Pet supply retail + grooming salon, 9 staff, LLC. CO sales tax (state + Denver), grooming licensure (limited in CO), USDA APHIS if I ever sell puppies (I do not), city kennel-adjacent permits.

**How I'd actually use this:** Daily — no. Weekly check-in, maybe. I'd want my office manager to be the primary user and I'd just get the weekly digest. The grooming side has its own permit calendar that I always forget about.

**What works for me:**
- CO deep coverage (I hope) means Denver-specific stuff might actually be captured.
- The score is a nice motivator.
- Magic-link share for my insurance broker at renewal time.

**What's broken or missing for me:**
- No POS / inventory integration. I use Lightspeed Retail. If you want to be the "operating system" for my business you need to know what I sell.
- Denver has home-rule sales tax that confuses everyone. I want to know you handle that, not just CO state.
- No individual employee tracking. My groomers have certifications that matter for liability.
- No reminder escalation — what happens if my office manager ignores the T-1 email? Does anyone else get pinged? Because she will ignore it.

**Features I'd pay extra for:**
- Escalation tree (if X doesn't acknowledge, ping Y).
- Denver home-rule sales tax tracking.

**Verdict:** Would trial.
**Price reaction:** Fine.

---

### #64 — Foundry Row Antiques, Brooklyn NY
**Owner:** Davide, sole proprietor (essentially)
**Profile:** Vintage furniture + estate antiques, 3 staff, LLC. NYC + NYS sales tax, NYC consumer affairs (secondhand dealer license, scale license if I weigh things).

**How I'd actually use this:** I would set it up, get the calendar, and almost never log in. I am 58, I run a dusty shop, I want one email a week telling me what's coming up. If your tool requires me to "engage" I will cancel.

**What works for me:**
- The email reminders. That is the whole product to me.
- AI-flagged obligations — I genuinely do not know what NYC DCWP rules apply to me and I would pay to find out.

**What's broken or missing for me:**
- NY is probably not on your deep-coverage list. NYC compliance is its own animal — DCWP, FDNY, scale inspections, sidewalk cafe permits if you put one chair outside.
- Secondhand dealer license has a police-reporting component (NYPD wants reports of certain purchases). You don't touch that.
- Document storage — 10GB is fine. But can I email-forward an attachment to a unique address per deadline? Because that is how I actually work.

**Features I'd pay extra for:**
- Email-in attachments to a per-deadline address.
- NYC DCWP-specific rule pack.

**Verdict:** Would trial if NY is in deep coverage. Otherwise pass.
**Price reaction:** $79 is fair. $20 would be fairer for what I'd actually use.

---

### #65 — Vermeer & Vine Jewelers, Newport Beach CA
**Owner:** Priya, second-generation owner
**Profile:** Independent jewelry store, 5 staff, S-corp. CA sales tax, CA Secretary of State, FinCEN/BSA AML compliance (jewelers buying loose stones over thresholds), Kimberley Process for diamonds, CA Bureau of Household Goods (none for us), Patriot Act §352 program.

**How I'd actually use this:** My office manager would own this. I'd want a clear AML calendar — annual AML program review, training certifications, SAR thresholds — because that is the thing that actually scares me. CA SOS is once a year and I can handle that.

**What works for me:**
- Centralized document storage for KP certificates from suppliers.
- Audit share link for my AML compliance attorney to review at year-end.
- Compliance score gamifies something nobody in my industry takes seriously enough.

**What's broken or missing for me:**
- AML is industry-specific and I doubt your template rules know about Jewelers Vigilance Committee guidance or FinCEN dealer-in-precious-metals/stones rules. If AI insights surface that, name your price. If not, this is a generic to-do list.
- No SAR (Suspicious Activity Report) tracking or workflow.
- No employee AML training tracking.
- No vendor due diligence module — I onboard new diamond suppliers and need to OFAC-screen them.

**Features I'd pay extra for:**
- AML/BSA module for dealers in precious stones.
- OFAC screening built-in.
- Annual AML training tracker per employee.

**Verdict:** Would buy if AML coverage is real. Trial otherwise.
**Price reaction:** $79 is cheap for what I need. $199 with the AML module would be a no-brainer.

---

### #66 — Flatiron Cannabis Co., Boulder CO
**Owner:** Devon, GM (founder is silent partner)
**Profile:** State-licensed adult-use dispensary, 18 staff, LLC. CO MED license, Metrc seed-to-sale, local Boulder license, 280E tax hell, banking restrictions, security plan compliance, METRC tag waste manifests.

**How I'd actually use this:** I would not. Or — let me revise — I might use it for the *non-cannabis* compliance (corp annual report, sales tax, employment). For anything cannabis-adjacent I do not want a second system. Everything cannabis flows through Metrc and I am paranoid about touching it.

**What works for me:**
- Non-cannabis deadlines (CO SOS, federal payroll, workers comp) in one place — fine.
- Compliance score might be useful for the non-cannabis side.

**What's broken or missing for me:**
- No Metrc integration. Obvious dealbreaker for the part of my business that actually matters.
- 280E is the single biggest tax issue in my life and you do not touch it.
- Cannabis banking — I'm with a cannabis-friendly credit union and have monthly reporting obligations. Not in scope.
- Putting any cannabis-related data in a generic SaaS cloud makes me nervous. State auditors can subpoena cloud data, my Metrc data is already with the state, I do not want a second copy somewhere else.
- METRC tag waste manifests — that's a real compliance thing and you don't know it exists.
- No security plan / camera retention tracking (CO MED requires 40-day camera retention).

**Features I'd pay extra for:**
- Honestly? Nothing — until you understand cannabis I am not the customer.

**Verdict:** Would pass.
**Price reaction:** $79 for the 30% of my compliance you cover is not worth opening a second login.

---

### #67 — Desert Vapor, Las Vegas NV
**Owner:** Trey, owner
**Profile:** Vape shop, 4 staff, LLC. NV sales tax, FDA PMTA (Premarket Tobacco Application) status of products I sell, NV OTP (Other Tobacco Products) tax, age-verification compliance, local tobacco retail license.

**How I'd actually use this:** I'd use it for the boring NV state filings. The PMTA stuff I track in a spreadsheet by SKU because the landscape changes every month and I have to pull product when FDA enforcement letters drop.

**What works for me:**
- NV is one of your deep-coverage states (I'm hoping). Sales tax + commerce tax (if I cross the threshold) would be helpful.
- Magic link for my landlord (they ask for licensing).

**What's broken or missing for me:**
- No PMTA SKU tracking. This is THE thing in vape compliance and you do not address it at all.
- No FDA enforcement letter monitoring. I get my news from r/electronic_cigarette which is, you know, not ideal.
- No age-verification audit trail (I use a separate ID scanner — it would be nice if you could ingest those logs).
- NV OTP tax has weird calculation rules I always get wrong. Generic "OTP filing due" is not enough.

**Features I'd pay extra for:**
- PMTA SKU status tracker with FDA enforcement updates.
- Age-verification log ingest.

**Verdict:** Would pass.
**Price reaction:** $79 with no PMTA awareness is just a generic deadline app to me.

---

### #68 — Beacon Hill Wine & Spirits, Boston MA
**Owner:** Erin, owner
**Profile:** Liquor store, 6 staff, LLC. MA ABCC license renewal, local licensing board, MA Dept of Revenue (alcohol excise + sales tax), TIPS training for staff, ID-check compliance.

**How I'd actually use this:** Annual ABCC renewal is the big one. I would use this to remind me of the local licensing board hearings I need to attend, my TIPS recerts, and my MA annual report. Day to day my POS handles sales; I just need the regulatory metronome.

**What works for me:**
- The metronome (calendar + reminders) is exactly what I want.
- Document storage for license certificates — currently in a binder behind the counter.
- Score is a fun nudge.

**What's broken or missing for me:**
- MA is probably not deep-coverage. ABCC has its own quirks (manager-of-record changes, ownership change filings) and template fallback won't catch those.
- No TIPS / alcohol-server training tracker per employee.
- No local licensing board calendar (Boston Licensing Board has monthly hearings I sometimes need to attend).
- No POS integration for excise tax reconciliation.

**Features I'd pay extra for:**
- Per-employee TIPS / RBS tracking.
- City licensing board calendar overlays.

**Verdict:** Would trial.
**Price reaction:** $79 is fair.

---

### #69 — Lone Star Arms & Ammo, rural TX
**Owner:** Cal, owner
**Profile:** FFL gun shop, 5 staff, LLC. ATF FFL renewal (every 3 years), ATF compliance inspections, Form 4473 retention (20+ years), Acquisition & Disposition (A&D) book, Texas LTC class instructor cert, OFAC checks on transfers.

**How I'd actually use this:** I would absolutely not put 4473s or A&D data anywhere near your cloud. For non-4473 stuff — sales tax, TX franchise tax, FFL renewal calendar — maybe.

**What works for me:**
- FFL renewal reminder. The 3-year cycle is easy to forget.
- TX franchise tax + sales tax reminders. Useful.

**What's broken or missing for me:**
- I am not putting 4473s in your cloud. Full stop. Even mentioning document attach makes me suspicious of what you're encouraging customers to upload.
- A&D book is bound paper for a reason. Cloud anything for ATF-required records is a legal minefield and you should explicitly say "do not upload 4473s here."
- AI insights — I do not want Claude reading my firearms records. That is a hard no.
- No ATF inspection prep workflow.
- Where are your servers? Who has access? What's your subpoena response policy? You probably have none of this written down and it matters to me a lot more than to your other customers.

**Features I'd pay extra for:**
- Honestly, just a quiet calendar that knows ATF cycles and never asks me to upload anything sensitive. Local-only mode would be a feature.

**Verdict:** Would pass. If you ever advertise yourself as FFL-friendly without addressing the 4473 question, I'd actively warn other dealers off.
**Price reaction:** I would pay $79 for the calendar alone but only if you make clear what NOT to upload.

---

### #70 — Westside Auto Care, Chicago IL
**Owner:** Sergio, owner
**Profile:** Independent auto repair, 8 staff, LLC. IL EPA used oil generator, refrigerant (608) cert tracking, ASE cert tracking, Illinois Repair of Motor Vehicles Act registration, Cook County environmental, Chicago BACP repair license.

**How I'd actually use this:** I'd use it primarily for the environmental side — used oil manifest cycles, parts washer service, refrigerant log requirements. The state corp stuff and sales tax I can handle, the environmental stuff is what gets shops fined.

**What works for me:**
- IL deep coverage (hopefully) — Chicago BACP and Cook County are real pain points.
- Document storage for hazmat manifests.
- AI insights might surface stuff I'm missing — I would actually try this.

**What's broken or missing for me:**
- No individual employee cert tracking. EPA 608 refrigerant cert is per technician, ASE certs are per tech, and they all expire on different cycles. This is the single most useful thing you could build for repair shops.
- No hazmat manifest workflow (I have to keep oil manifests 3 years).
- No integration with anything shop-management (Mitchell1, Shop-Ware, ALLDATA).
- No reminder for parts-washer service intervals (Safety-Kleen sends them quarterly but I forget).
- Chicago BACP rules are notoriously fiddly — template fallback won't cut it.

**Features I'd pay extra for:**
- Per-tech 608 / ASE / state inspector cert tracking.
- Hazmat manifest module.

**Verdict:** Would trial. Buy if per-tech cert tracking ships.
**Price reaction:** $79 is fine. $129 with tech cert tracking is a yes.

---

### #71 — Pacific Coast Collision, Long Beach CA
**Owner:** Marcela, GM
**Profile:** Auto body shop, 11 staff, S-corp. CARB regs, South Coast AQMD permits, CA BAR (Bureau of Automotive Repair), used oil manifests, paint booth permits, respirator fit-testing OSHA, EPA RRP if we do older vehicles with lead-bearing paint (rare but).

**How I'd actually use this:** This would have to be my office manager's morning routine. Body shops are inspected by like 5 different agencies and the fines are real ($10k+ per AQMD violation). If the calendar is accurate it could save me one fine and pay for itself for a decade.

**What works for me:**
- The calendar concept, if you can populate it correctly for CA body shops.
- Audit share link for my insurance carrier — they ask for proof of regulatory compliance at renewal.
- Document attach for permits.

**What's broken or missing for me:**
- CARB and AQMD are not federal — they're California specific and South Coast AQMD specifically. Your template fallback for "the other 46 states" is useless to me and even if CA is deep-coverage I am skeptical you cover AQMD Rule 1147 / Rule 1151 paint booth requirements correctly.
- No painter respirator fit-test tracking per employee (OSHA annual, more often if a painter changes).
- No paint VOC tracking / Material Reduction Plan reporting (AQMD requires this).
- No BAR Smog Check station compliance if I had one (I don't, but you should know).
- No CA prop 65 warning signage compliance.

**Features I'd pay extra for:**
- AQMD-specific module (paint booth permits, VOC reporting, parts washer).
- Per-painter respirator fit-test calendar.
- BAR-specific deadlines.

**Verdict:** Would buy if you can prove deep AQMD coverage. Otherwise pass — your generic version misses the things that actually get me fined.
**Price reaction:** $79 is a steal if AQMD coverage is real. I currently pay an environmental consultant $400/mo for less.

---

### #72 — First Coast Auto Sales, Jacksonville FL
**Owner:** Reggie, owner
**Profile:** Used car dealership ~80 units, 6 staff, LLC. FL DMV dealer license (VI), surety bond, FTC Used Car Rule (Buyers Guide), Reg Z if we floor-finance, odometer disclosure, FL DOR sales tax, Safeguards Rule (GLBA — actually relevant now for used car dealers since 2023).

**How I'd actually use this:** Daily I am not logging in. Monthly I'd want a check-in. The GLBA Safeguards Rule scares me because FTC has been bringing actions against dealers and I do not have a written info security program — your AI insights surfacing that would be useful.

**What works for me:**
- AI insights — if you flagged the GLBA Safeguards Rule for me, I'd be impressed.
- Surety bond renewal reminder — I have missed this once and it is a nightmare.
- FL dealer license renewal calendar.

**What's broken or missing for me:**
- No Buyers Guide compliance tracking (FTC Used Car Rule — every car on the lot needs one, and the new 2024 rule changes are non-trivial).
- No DMS / DealerTrack / Dealertrack / RouteOne integration.
- No odometer statement audit trail.
- No Reg Z disclosures for our in-house financing.
- No "Combating Auto Retail Scams" / CARS Rule readiness (FTC rule, currently in litigation but might come back).

**Features I'd pay extra for:**
- GLBA Safeguards Rule readiness module (written info sec program template, vendor management, annual report).
- Buyers Guide compliance checker.

**Verdict:** Would trial.
**Price reaction:** $79 is cheap for a dealership. We pay more for our DMS per seat.

---

### #73 — Sunshine State Cycles, Daytona FL
**Owner:** Brett, owner
**Profile:** Motorcycle dealership (multi-line), 12 staff, S-corp. FL DMV dealer license (motorcycle endorsement), DMV titling/registration deadlines per unit sold, manufacturer franchise agreements, FL sales tax, EPA noise compliance on aftermarket, surety bond.

**How I'd actually use this:** F&I manager and my office manager would split the duties. The per-unit DMV titling deadlines (must title within X days of sale in FL) are the operational compliance that actually matters; everything else is once-a-year.

**What works for me:**
- Annual stuff (dealer license, sales tax cycle, surety bond) — sure.
- Score might be useful for a corporate-style dashboard.

**What's broken or missing for me:**
- No per-transaction tracking. FL requires titles transferred within 30 days of sale; I currently track this in a spreadsheet and a calendar app sometimes loses entries. You don't do anything per-unit, which means you don't help with the actual daily compliance.
- No DMS integration for motorcycle dealers (Lightspeed DMS, Talon, etc).
- No manufacturer compliance (Harley, Yamaha, Honda all have their own dealer agreement audit cycles).
- No floor plan / inventory financing covenants tracking.
- No Daytona Bike Week-specific permit lifecycle (we set up off-site during the rally and the permitting is a circus).

**Features I'd pay extra for:**
- Per-VIN DMV titling deadline tracker.
- Manufacturer audit calendar.

**Verdict:** Would pass — your scope misses the per-VIN ops that actually hurt.
**Price reaction:** $79 is meaningless if I'm still maintaining my spreadsheet.

---

### #74 — Pedal & Path Cyclery, San Francisco CA
**Owner:** Mei, co-owner
**Profile:** Bike shop + repair, 5 staff, LLC. CA sales tax, SF business tax, SFDPH if we sold food (we don't), e-bike specific (no special license but battery handling/disposal is becoming a thing).

**How I'd actually use this:** Monthly check-in, maybe. SF compliance is a lot of small fiddly stuff (sidewalk encroachment permit, sign permit if we change signage, ADA stuff). I'd want the calendar to be SF-aware.

**What works for me:**
- CA deep coverage hopefully includes SF specifics.
- Calendar + reminders for the easy stuff.

**What's broken or missing for me:**
- Lithium battery disposal compliance is emerging — California is tightening rules on e-bike batteries, no one is tracking this for shops yet, you'd be ahead of the curve.
- No POS integration (we use Lightspeed Retail).
- SF business tax / gross receipts is its own nightmare — generic CA coverage won't help.
- No ADA accessibility tracking — small CA retailers are getting hit with ADA drive-by lawsuits constantly.

**Features I'd pay extra for:**
- Lithium battery / e-bike compliance module.
- ADA self-assessment checklist.

**Verdict:** Would trial.
**Price reaction:** $79 is fine.

---

### #75 — Park Avenue Cleaners, Manhattan NY
**Owner:** Sam, second-gen owner
**Profile:** Family dry cleaner, 4 staff, LLC. NYSDEC perc phase-out (perc banned in NYC residential buildings since 2020), hazmat waste manifests, boiler permit, FDNY permit for combustibles, NYC DCWP licensing.

**How I'd actually use this:** My daughter (who is taking over the business) would be the user. Older operators in my industry are not adopting SaaS. The perc phase-out has been the dominating compliance issue for 5 years and I am post-perc now — but the manifest retention from the transition matters.

**What works for me:**
- Document attach for hazmat manifests — yes, this is actually useful.
- Boiler permit + FDNY permit reminders.
- AI insights could be interesting if it knows NYSDEC.

**What's broken or missing for me:**
- NYC compliance is its own jurisdiction. NYSDEC perc rules, FDNY C of F renewal, DCWP licensing, boiler inspection cycles — template fallback is going to miss most of this.
- No hazmat waste manifest workflow (uniform hazardous waste manifest tracking is its own discipline).
- No air permit tracking for the new hydrocarbon machines.
- No PERC closure / soil testing tracking (if you switched from perc, you have ongoing groundwater monitoring obligations potentially).

**Features I'd pay extra for:**
- Dry cleaner specific module (perc legacy, hydrocarbon air permits, manifests).

**Verdict:** Would pass for now. My daughter might trial it in a year.
**Price reaction:** $79 is fine if it works for NYC. Without NYC depth it's worthless.

---

### #76 — BronxWash Laundromats (3 locations), Bronx NY
**Owner:** Hector, owner
**Profile:** Self-service laundromat chain, 3 locations, 6 staff total, LLC per location. NYC DCWP licensing per location, FDNY permits, NYC water board, weights & measures on coin/card readers, ADA, sales tax (laundry is exempt in NY but vended snacks aren't).

**How I'd actually use this:** I'd want a multi-location view. Three separate LLCs, three separate license cycles, but I'd want one dashboard. Today I keep three calendars and it is a mess.

**What works for me:**
- Multi-deadline calendar in theory.
- Document storage.

**What's broken or missing for me:**
- No multi-location aggregator — you've explicitly said no franchise multi-location, which is exactly what I am. I have to set up 3 separate accounts? At $79 each? That's $237/mo for me which is absurd.
- NYC-specific compliance depth concerns (same as the dry cleaner).
- No weights & measures tracking per coin reader.
- No water board (NYC DEP) reporting (we use a lot of water — there's submetering reporting).

**Features I'd pay extra for:**
- Multi-location dashboard.
- W&M calibration tracking.

**Verdict:** Would pass until multi-location is supported.
**Price reaction:** $79 × 3 = absolute no. Should be one account, $99-$129/mo with location scaling.

---

### #77 — Bluff City Pawn & Loan, Memphis TN
**Owner:** LaToya, owner
**Profile:** Pawnshop, 4 staff, LLC. Local Memphis police daily reporting (LeadsOnline), TN pawn license, FFL (we sell some firearms), OFAC screening per transaction, IRS 8300 for cash over $10k, state usury caps.

**How I'd actually use this:** I'd use it for the FFL renewal and the annual TN pawn license. The daily police reporting goes through LeadsOnline and I'm not going to duplicate that workflow. OFAC screening is per-transaction and lives in my pawn management software.

**What works for me:**
- FFL renewal reminder (3-year cycle — same as the gun shop, easy to forget).
- TN pawn license + business license renewals.
- IRS 8300 reminder cycle.

**What's broken or missing for me:**
- No PawnMaster / Bravo / Data Age integration. Pawn-specific software handles 80% of compliance for us.
- No local police reporting awareness (every jurisdiction has different rules — Memphis uses LeadsOnline, others use direct PD reporting).
- Same concern as the gun shop about cloud document storage for ATF records.
- No usury / state interest rate cap tracking (TN has specific caps for pawn).

**Features I'd pay extra for:**
- Pawn management software integration.
- IRS 8300 workflow.

**Verdict:** Would trial for the FFL/state license reminders. Would not adopt as primary compliance system.
**Price reaction:** $79 is fine for what it does.

---

### #78 — Houston Key Rescue, Houston TX
**Owner:** Dwayne, owner-operator
**Profile:** Mobile locksmith, 3 staff (2 techs + me), LLC. TX DPS PSB locksmith license, individual locksmith licenses per tech, TX sales tax, vehicle registration / DOT (we're under threshold for federal DOT but state requires commercial vehicle stuff).

**How I'd actually use this:** I'd use it on my phone in the truck. If you don't have a mobile native app this is a problem — I'm not opening a laptop. A mobile-responsive web app is okay but I need to add a deadline from my phone while standing at a job site.

**What works for me:**
- The concept of one calendar for everything.
- Per-employee tracking would matter (state PSB license per tech) — wait, you don't do that. Strike that.

**What's broken or missing for me:**
- No native mobile app. I am a 100% mobile business.
- No per-tech license tracking. TX requires each individual locksmith to be licensed — and I have to track those.
- No vehicle compliance (registration, inspection, insurance per truck).
- No background check renewal tracking (TX PSB requires background checks).
- $79 for 3 people feels expensive when half the features don't apply to me.

**Features I'd pay extra for:**
- Mobile native app.
- Per-tech license + background check tracker.
- Per-vehicle compliance.

**Verdict:** Would pass.
**Price reaction:** $79 is too much for a 3-person mobile crew with no mobile app.

---

### #79 — Saguaro Self Storage, Phoenix AZ
**Owner:** Roger, owner
**Profile:** Self-storage facility, 220 units, 4 staff, LLC. AZ corporation commission filings, Maricopa County business permit, sales tax (storage is taxable in AZ as TPT), lien sale notice statutory requirements, ADA, fire marshal inspection.

**How I'd actually use this:** Honestly? I don't think I would. I am 67, I run one facility, my "compliance calendar" is a paper wall calendar in the office and an alarm on my phone for the AZ annual report. The lien sale process is governed by state statute and I do it the same way every quarter — that's not really a "compliance deadline" problem.

**What works for me:**
- Annual report reminder I guess.
- Score might be a fun motivator for my manager.

**What's broken or missing for me:**
- Lien sale notice workflow (AZ requires specific notice timing and publication — not a one-shot deadline but a multi-step process per delinquent unit).
- No SiteLink / storEDGE / Easy Storage Solutions integration.
- AZ TPT (sales tax) is its own thing — fine if you cover it.
- No ADA tracking. AZ has its share of drive-by lawsuits.

**Features I'd pay extra for:**
- Lien sale process workflow.
- Storage software integration.

**Verdict:** Would pass.
**Price reaction:** $79/month for what amounts to a wall calendar with email reminders is laughable for my situation. $15/mo basic tier maybe.

---

### #80 — Peachtree Moving Co., Atlanta GA
**Owner:** Tanya, co-owner with my husband
**Profile:** Local + interstate moving, 14 staff, LLC. GA DPS household goods carrier license, USDOT number, MC authority for interstate, IRP, IFTA, FMCSA drug & alcohol clearinghouse, hours of service, BOC-3, ADA, surety bond, GA sales tax.

**How I'd actually use this:** Office manager every morning. Movers are heavily regulated and the fines are constant. If this could be my single source of truth for everything except DVIRs and ELDs I'd be thrilled. The DOT side is what makes us different from a regular small business.

**What works for me:**
- The portfolio view for my CPA — yes please.
- Document storage for permits, IRP cab cards, IFTA decals.
- Compliance score concept fits us well.

**What's broken or missing for me:**
- No DOT/FMCSA tracker. You've explicitly said this is out of scope and it is 50% of my compliance burden. UCR, BOC-3, MCS-150 biennial update, drug/alcohol clearinghouse queries — none of this is in your product.
- No IRP / IFTA quarterly filing reminders that understand the per-state mileage calculation cycle.
- No driver qualification file tracking per driver (medical card, MVR pull, road test, drug test).
- No vehicle maintenance / annual DOT inspection per truck.
- GA HHGCC (Household Goods Carrier) license is GA-specific and template fallback won't cut it.

**Features I'd pay extra for:**
- DOT/FMCSA module (this would be transformative).
- Driver qualification file tracking.
- Per-truck inspection tracking.

**Verdict:** Would trial for the non-DOT side. Would buy aggressively if DOT module ever ships.
**Price reaction:** $79 is fine for what it does. With a DOT module I'd pay $250+.

---

## Patterns across retail, auto & specialty

**The common gap is industry-specific depth.** Almost every persona named features that are core to their industry's compliance reality and absent from OperatorOS: METRC for cannabis, PMTA for vape, AQMD for body shops, 4473/A&D for FFLs, DOT/FMCSA for movers, lien-sale workflow for storage, per-VIN titling for dealers, hazmat manifests for repair and dry cleaners. Generic "deadline calendar + AI insights" is a decent foundation but not the buying trigger for these operators.

**Per-employee certification tracking is the most-requested missing feature** — bookstore cafe (food handler), repair (608 + ASE), body shop (respirator fit-test), liquor (TIPS), locksmith (per-tech license), mover (driver qual file). This is a horizontal gap, not industry-specific.

**POS / industry-software integration is the second-most requested.** Retailers want Shopify/Lightspeed/Square ties for sales-tax classification; specialty operators want their vertical software (PawnMaster, SiteLink, DealerTrack, Mitchell1) integrated.

**Multi-location is a hard limit for the laundromat persona** — pricing as if every location is a separate business is a non-starter.

**Trust concerns from FFL and pawn personas** about cloud document storage are real and underserved. An explicit "don't upload X" policy and clear subpoena/access posture would help.

**$79 is well-priced for genuine specialty operators** (jewelers, movers, body shops) where one missed filing exceeds the annual cost. It is overpriced for low-touch retailers (vintage, storage) who want a wall calendar.
# Batch 5 — Professional Services, Tech & Specialty (Businesses 81-100)

---

### #81 — Marin & Co. CPA, Hoboken NJ
**Owner:** Lisa, sole proprietor CPA
**Profile:** Solo CPA firm, 1 CPA + 2 part-time bookkeepers, 90 SMB clients across NJ/NY/PA, S-corp.

**How I'd actually use this:** I'd want to bulk-import all 90 clients from my Karbon work list on Monday morning, see a single dashboard where every client's compliance score lives, and triage the red ones before my Tuesday client calls. The bookkeepers would handle document chase-up via the portal. I personally only want to see the exceptions — anyone <70 or with a deadline inside 14 days.

**What works for me:**
- Portfolio view across all clients is the right shape — that's literally what I've been building in a Google Sheet for four years
- White-label reports at $299 is reasonable if I can actually rebrand them as "Marin & Co. Compliance Review"
- Magic-link onboarding means I don't have to teach 90 clients another password

**What's broken or missing for me:**
- No Karbon integration is a real blocker — I run my entire practice in Karbon and I'm not double-entering 90 clients
- No QBO sync means I can't auto-pull payroll cadence from where it actually lives
- Only 5 states with deep coverage and I have clients in NJ, NY, PA — if NJ isn't one of the 5 I'm using template fallbacks for half my book, which is worse than nothing because clients will trust it
- Can't rebill the $79 SMB tier to clients with a markup — I want to charge clients $129/mo and pocket the spread, or include it in my monthly retainer transparently
- No client-side approval workflow — when I prep a deadline action for a client to sign off, I need DocuSign or at minimum an in-tool approve button

**Features I'd pay extra for:**
- Karbon two-way sync ($100/mo more, easily)
- "Compliance health report" PDF I can send clients quarterly as part of my advisory pitch
- Auto-detection of new client entity changes (formation, dissolution, state of registration changes)

**Verdict:** Would trial, would buy if Karbon integration ships within 6 months and NJ is in deep-coverage states.
**Price reaction:** $299/mo is fair if I genuinely use it across 90 clients — that's $3.32/client which is below what I'd reasonably markup. Cheap if it works, expensive if I'm double-entering.

---

### #82 — Buckeye Bookkeeping, Columbus OH
**Owner:** Greg, managing partner
**Profile:** 5-person bookkeeping firm, 200+ SMB clients all on QBO, LLC.

**How I'd actually use this:** Honestly, I wouldn't unless QBO sync is real. My whole team lives in QBO Accountant and TaxDome. If OperatorOS becomes a tab I open once a week to chase compliance exceptions across the book, fine — but it has to plug into the data we already have.

**What works for me:**
- The accountant tier price is competitive with TaxDome's compliance add-on
- Audit-share URLs are useful — we get asked by lenders for "compliance status" on borrower clients constantly

**What's broken or missing for me:**
- No QBO integration is the dealbreaker — period. Our clients' entity info, payroll cadence, sales tax filing freq all live in QBO. I'm not paying my staff $35/hr to type that into another system for 200 clients.
- No TaxDome integration means duplicate client portals — clients will get confused which one to log into
- White-label needs to go further than a logo: custom domain (compliance.buckeyebooks.com), branded emails from our sending domain, our colors
- Bulk CSV import for 200 clients needs to be bulletproof — including NAICS lookup from EIN, not me typing NAICS codes for 200 businesses
- No payroll-tax-deposit auto-pay or even integration with Gusto/Rippling/ADP — payroll compliance is 60% of what we do
- Ohio CAT (commercial activity tax) better be in there or it's useless for our base

**Features I'd pay extra for:**
- QBO + Gusto + Rippling sync as a bundle, even $200/mo on top
- Compliance score that factors in bookkeeping cleanliness (uncategorized transactions, bank rec status) — sell us as a single dashboard

**Verdict:** Would pass at current state. Would trial seriously once QBO sync ships.
**Price reaction:** $299/mo is a no-brainer for 200 clients IF it integrates. Without QBO it's $299/mo for a glorified spreadsheet.

---

### #83 — Reyes & Patel Immigration Law, Los Angeles CA
**Owner:** Marisol, managing partner
**Profile:** Immigration practice, 2 attorneys + 3 paralegals, PLLC, heavy EOIR/USCIS workflow.

**How I'd actually use this:** Office manager would set it up and check it weekly. I'd want bar dues (CA + NY for my partner), MCLE for both attorneys, EOIR registration renewals, BIA recognition for one of our paralegals, and malpractice insurance on the calendar. The deadlines for clients (NTA response, I-589 filings) we already track in INSZoom — we don't need this for casework.

**What works for me:**
- Centralized firm-side compliance calendar is genuinely missing from our stack
- Document attach per deadline is nice — I can attach the CA bar receipt right to the renewal

**What's broken or missing for me:**
- No IOLTA reconciliation — every CA attorney has to do this monthly and it's an automatic bar grievance if you miss it. If you don't track IOLTA you don't understand law firms.
- No conflict-check system
- No MCLE credit tracking with hours-by-category (CA requires elimination of bias, competence, ethics breakdowns) — just a "renewal date" isn't enough
- No INSZoom or Docketwise integration
- Doesn't seem to know about EOIR e-registration biennial renewal or BIA recognition cycles — that's industry-specific and I'd bet it's not in your template fallback

**Features I'd pay extra for:**
- IOLTA tracking + three-way reconciliation, even $50/mo more
- MCLE credit accumulator that pulls from CLE provider emails

**Verdict:** Would pass. Solves a real-but-narrow problem (firm-side bar/MCLE/insurance) for $79/mo when my admin already does it in a Google Cal for free.
**Price reaction:** $79/mo is too much for what I'd actually use. $19/mo for a "firm compliance lite" tier I'd buy tomorrow.

---

### #84 — Henderson Estate Law, Dallas TX
**Owner:** Bob, solo attorney
**Profile:** Solo estate planning lawyer + 1 paralegal, S-corp, primarily wills/trusts/probate.

**How I'd actually use this:** I'd set it up Saturday morning, plug in TX bar number, MCLE, malpractice, S-corp filings. Then I'd probably forget about it until the first T-30 email arrives and decide if I'm impressed.

**What works for me:**
- Simple. I am a solo attorney, I don't need software with 400 features.
- Email reminders at T-30/T-7/T-1 — that's the right cadence

**What's broken or missing for me:**
- Texas requires 15 MCLE hours/yr including 3 ethics — no granular tracking visible
- No IOLTA reconciliation (smaller deal for me than for litigators but still required)
- No integration with my Clio for client matter compliance
- TX franchise tax (no-tax-due report) better be in there — that's the single most-missed filing by TX solos

**Features I'd pay extra for:**
- A "lawyer pack" with IOLTA + MCLE breakdowns + malpractice carrier roster

**Verdict:** Would trial. If it nails TX-specific stuff in the first month, I'd keep it.
**Price reaction:** $79/mo is fine — that's two billable units a year. Not the deciding factor.

---

### #85 — Hartwell Insurance, Weatherford OK
**Owner:** Dale, agency principal
**Profile:** Captive Allstate agent, 4 staff, S-corp, rural OK.

**How I'd actually use this:** I'd want my OK Department of Insurance license renewal, my CE credits (24 hrs/2 yrs in OK), my E&O policy renewal, and my Allstate appointment renewal in one spot. Office manager would log in once a month and remind me what's coming.

**What works for me:**
- Calendar of license + CE deadlines is genuinely useful — I missed CE one year and it was a nightmare
- Email reminders fit how my office runs

**What's broken or missing for me:**
- Need to track CE credits per state (some of my staff are licensed in TX too) and per line of authority (Life/Health vs P&C have different requirements in OK)
- No appointment tracking per carrier — I'm captive Allstate but if I were independent this would be huge
- No E&O coverage limit tracking or renewal pricing comparison
- Allstate-specific corporate compliance requirements (their own audit cycles) obviously not in here

**Features I'd pay extra for:**
- CE credit tracker that reads NIPR/Sircon
- E&O renewal shopping integration

**Verdict:** Would trial.
**Price reaction:** $79/mo is reasonable for an agency, slightly steep for a 4-person captive shop in rural OK. $49 would be a yes immediately.

---

### #86 — Sunshine Realty Group, Miami FL
**Owner:** Carmen, broker/owner
**Profile:** Real estate brokerage, 1 broker + 22 1099 agents, LLC.

**How I'd actually use this:** I'd add my broker license, all 22 agent licenses, FL DBPR renewal cycle, my MLS dues, fair housing CE for everyone, and my trust account audit dates. Each agent's license renewal sits on my desk because I'm the broker of record.

**What works for me:**
- 23 license renewals on one dashboard is exactly the workflow gap
- Document attach for license certificates per agent

**What's broken or missing for me:**
- No trust account reconciliation / audit prep — FL requires monthly broker trust account reconciliation and it's a license-pull issue if you miss it
- No MLS dues tracking (multiple MLSs in S. FL — MIAMI, BeachesMLS, Realtor.com lockboxes — each with their own cycle)
- No fair housing or ethics CE category breakdown (FL requires 3 hrs core law, 3 hrs ethics)
- No agent onboarding workflow — when I hire a new 1099 I need W-9 + ICA + sponsoring broker letter + transfer of license, none of that is here
- Spanish-language email reminders — half my agents prefer Spanish

**Features I'd pay extra for:**
- Trust account three-way reconciliation
- Per-agent commission compliance docs

**Verdict:** Would trial. Would buy if trust accounting added.
**Price reaction:** $79/mo for 23 licensees is cheap — that's $3.43/license. Fine.

---

### #87 — Mile High Property Management, Denver CO
**Owner:** Janet, owner-operator
**Profile:** Property mgmt, 5 staff, 50 SFR units across 14 owners, LLC + CO real estate license.

**How I'd actually use this:** My one office admin would own this. We'd track my CO real estate broker license, my employing broker designation, each rental property's annual safety items (smoke/CO alarm certs, radon retest cycle, eviction filings, lead paint disclosures on pre-1978 units), and owner 1099 cycles.

**What works for me:**
- Per-property compliance is a real gap — I track this in Buildium notes which is awful
- Audit-share URL is useful for showing owners their unit is current

**What's broken or missing for me:**
- No Buildium / AppFolio / Yardi integration — my entire op runs in Buildium, I can't have two systems of record on properties
- No trust account reconciliation (CO REC requires monthly)
- No per-unit lease renewal cadence
- No tenant-side anything (I don't expect it, but it'd be a wishlist)
- Lead paint disclosure tracking per pre-1978 unit isn't going to be in a generic template

**Features I'd pay extra for:**
- Buildium sync at any price
- CO REC audit prep package

**Verdict:** Would pass. Buildium integration is the wall.
**Price reaction:** $79/mo is fine in isolation, but it's $79/mo for the second tool that does 30% of what my first tool already does.

---

### #88 — Aspen Studio Architects, Portland OR
**Owner:** Mei, principal architect
**Profile:** Boutique architecture firm, 6 staff (3 RAs, 1 intern, 2 admin), residential + light commercial, LLC.

**How I'd actually use this:** I'd want my OR Board of Architect Examiners renewal, NCARB record annual fees, AIA membership dues, my 24 HSW CE hours/2yrs, and each project's COI delivery cadence on this. Office manager handles renewals, I get a heads-up before each one.

**What works for me:**
- Single calendar for my license + 2 other RAs' licenses is right
- COI tracking per active project would be huge if it exists

**What's broken or missing for me:**
- No AIA contract document tracking (B101, A201, etc. — we issue these constantly)
- No CE granularity — OR requires 24 HSW hours per renewal and I need to see the running total
- No COI/insurance certificate automation — we send these to GCs/owners constantly
- No NCARB record sync (probably impossible, but worth saying)
- No multi-state license tracking complexity — I'm reciprocal in WA and CA and the renewal cycles differ

**Features I'd pay extra for:**
- CE credit running total that pulls from AIA CES transcript
- COI automation per project

**Verdict:** Would trial.
**Price reaction:** $79/mo is fair. Honestly I'd pay $129 for the AIA-specific stuff.

---

### #89 — Detroit Civil Group, Detroit MI
**Owner:** Marcus, PE/principal
**Profile:** Civil engineering consultancy, 9 staff (4 PEs, 2 EITs, 3 CAD/admin), S-corp, MI-based, projects in MI/OH/IN.

**How I'd actually use this:** I'd track PE licenses for all 4 PEs across MI, OH, IN (different cycles, different CE requirements), NCEES record annual fees, COA (Certificate of Authorization) for the firm in each state, professional liability, and project-level COIs.

**What works for me:**
- Multi-PE multi-state tracking is the right shape — we do this in Excel today
- Document attach per PE per state license is genuinely useful

**What's broken or missing for me:**
- Firm-level Certificate of Authorization renewals across states is the single biggest miss for an engineering firm — we get pinged on this constantly and it varies wildly by state
- PE CE requirements vary by state (MI = 30 hrs/2 yrs, OH = 30 hrs/2 yrs with 2 ethics, IN = 30 hrs/2 yrs) — needs to be granular
- No AIA-style project doc tracking
- No integration with Deltek or BQE for project compliance

**Features I'd pay extra for:**
- Multi-state COA tracking module
- PE CE state-specific category tracking

**Verdict:** Would trial. Would buy if multi-state COA + PE CE granularity ship.
**Price reaction:** $79/mo for 4 PEs across 3 states is cheap. I'd pay $150 easily.

---

### #90 — Ridgeline Marketing, Austin TX
**Owner:** Priya, founder/CEO
**Profile:** Independent marketing agency, 11 staff, LLC, retainer + project work.

**How I'd actually use this:** I'd set it up, find that we have basically no industry-specific compliance, and probably cancel after trial. We have TX franchise tax, federal payroll, sales tax (we collect on some deliverables), and... that's it.

**What works for me:**
- Payroll cadence reminders are useful for our admin
- TX franchise tax reminder

**What's broken or missing for me:**
- We have no regulatory body, no licensing, no CE — the value prop is thin for a marketing agency
- Sales tax tracking across the states our clients are in (nexus) isn't really here
- The AI "obligations you might be missing" is probably the only feature that would tell me anything new, and I'd want it to actually flag nexus risk

**Features I'd pay extra for:**
- State sales tax nexus monitor

**Verdict:** Would trial, likely pass. Not enough surface area for an agency.
**Price reaction:** $79/mo for what amounts to 5 federal/state filings/yr is overpriced for us. $29/mo "general business compliance" tier would convert me.

---

### #91 — Pixel & Pine Web Studio, Seattle WA
**Owner:** Jordan, co-founder
**Profile:** Web dev / Shopify agency, 7 staff fully remote across WA/OR/CO/NY, LLC.

**How I'd actually use this:** I'd input our entity info, see what comes back, and probably realize the more interesting thing is the multi-state foreign qualification stuff because we have remote employees in 4 states.

**What works for me:**
- Multi-state foreign qualification / payroll registration is a real headache — if you actually surface this it's valuable
- WA B&O tax cadence reminders

**What's broken or missing for me:**
- No employment law tracking per state where we have employees (different sick leave, WARN, final paycheck rules) — this is what would actually be valuable for a distributed team
- No real "remote workforce compliance" framing
- Web agencies have essentially zero industry compliance — so this is just generic biz stuff

**Features I'd pay extra for:**
- Remote employee state-by-state compliance dashboard
- 1099 vs W-2 misclassification risk audit

**Verdict:** Would trial.
**Price reaction:** $79/mo is fine if it surfaces the multi-state stuff. If it's just federal calendar + payroll, no.

---

### #92 — Drift SaaS, San Francisco CA
**Owner:** Anya, COO
**Profile:** Series A SaaS, 8 staff, Delaware C-corp HQ in SF, pre-SOC2.

**How I'd actually use this:** I'd plug in our Delaware C-corp + CA foreign qualification, see if it catches DE franchise tax, FinCEN BOI, R&D tax credit windows, and... that's about all I'd need from this. Our real compliance pain is SOC2, which this doesn't do.

**What works for me:**
- DE franchise tax + FinCEN BOI reminders are exactly the kind of "I forgot" filings that bite startups
- Foreign qualification tracking across states where we have employees

**What's broken or missing for me:**
- No SOC2 / ISO 27001 / HIPAA framework module — this is the actual compliance my buyers ask about and we're paying Vanta $20k/yr for it. If you don't do SOC2 you're not "compliance" software for a SaaS startup, you're "regulatory filings" software, which is a much smaller wedge
- No data privacy framework (GDPR, CCPA, CPRA)
- No R&D tax credit prep workflow — just a "deadline" reminder is useless, I need the docs/methodology
- No equity admin (83(b) deadlines for new hires, ISO/NSO timing)

**Features I'd pay extra for:**
- A real SOC2 module would be a $500/mo upgrade tomorrow — but Vanta/Drata already do this and have a 5-year head start
- 83(b) tracking per new hire

**Verdict:** Would trial for DE franchise + BOI. Would pass for any deeper use case. Vanta owns my actual compliance budget.
**Price reaction:** $79/mo is fine for what it'd do — but it's a rounding error vs. what we actually need.

---

### #93 — Hazel Lane Photography, Nashville TN
**Owner:** Hazel, owner/photographer
**Profile:** Wedding photography, 1 owner + 4 contracted second shooters, sole prop, 60-80 weddings/yr.

**How I'd actually use this:** I... wouldn't? I have a business license, a TN sales tax account because TN taxes wedding photo services, and 1099s for my second shooters. That's basically my entire compliance world.

**What works for me:**
- TN sales tax filing reminder, sure
- 1099 deadline reminder in January, sure

**What's broken or missing for me:**
- There's nothing here for me to manage. I have no license, no CE, no regulatory body.
- I do my taxes with my CPA and she handles the rest

**Features I'd pay extra for:**
- Honestly, nothing

**Verdict:** Would pass. Laughed a little.
**Price reaction:** $79/mo is roughly half a small print sale. I'm not paying that to be reminded of two filings a year my accountant already handles.

---

### #94 — Magnolia Events Co., Charleston SC
**Owner:** Caroline, owner/lead planner
**Profile:** High-end wedding planning, 3 staff, LLC, 25-30 weddings/yr at $50k+ average.

**How I'd actually use this:** Office manager would log in once a month. We'd track SC sales tax (we're a service so it's narrow), business license renewal, our COI/liability insurance, and our two W-2s' workers comp audit. That's about it.

**What works for me:**
- COI/insurance reminders matter to us because venues constantly request COIs
- Workers comp audit reminder

**What's broken or missing for me:**
- COI automation per venue would actually be valuable
- No vendor/contractor compliance tracking — we vet 100+ vendors a year for licensing, insurance
- No client contract milestone tracking

**Features I'd pay extra for:**
- Vendor compliance vetting workflow

**Verdict:** Would trial.
**Price reaction:** $79/mo is the price of one client lunch — fine if it saves me 2 hrs/mo.

---

### #95 — Desert Shine Mobile Wash, Phoenix AZ
**Owner:** Tony, owner
**Profile:** Mobile car wash subscription, 6 staff, 3 vans, S-corp.

**How I'd actually use this:** Honestly I'd set it up because my bookkeeper told me to. AZ TPT (transaction privilege tax) cadence, workers comp audit, vehicle registration on 3 vans, ADEQ if I'm pulling wastewater anywhere, and that's mostly it.

**What works for me:**
- AZ TPT reminders
- Workers comp audit heads-up (got nailed last year)

**What's broken or missing for me:**
- No vehicle/fleet compliance (registration cycles per van, insurance per van) — small but I have 3 vans
- ADEQ stormwater / wastewater for mobile wash is the real risk, not the calendar stuff
- No customer-side subscription billing (Stripe-adjacent), not your job but I'd love a single bill

**Features I'd pay extra for:**
- Fleet vehicle tracking
- ADEQ wastewater module

**Verdict:** Would trial.
**Price reaction:** $79/mo is fine.

---

### #96 — Beacon Hill Cleaners, Boston MA
**Owner:** Eileen, owner
**Profile:** Residential cleaning, 22 W-2 cleaners, S-corp, MA.

**How I'd actually use this:** Office manager owns this. We'd track MA business filings, MA paid family leave (PFML), workers comp audit (huge for us — 22 W-2 cleaners means a real audit every year), our cleaning chem SDS / EPA registration list, and our bonding renewal.

**What works for me:**
- Workers comp audit reminder + doc attach — that audit is brutal and I always scramble
- PFML quarterly reminder
- MA-specific if MA is one of the 5 deep-coverage states (please be)

**What's broken or missing for me:**
- No SDS/chemical inventory tracking — EPA + OSHA requirement for commercial cleaning
- No bonding/insurance renewal with policy limit tracking
- No employee onboarding compliance (I9, MA new hire reporting) — I do 5-10 new hires a year
- Background check renewal tracking per cleaner — we work in homes

**Features I'd pay extra for:**
- SDS library + chemical compliance module
- Per-employee background check renewal

**Verdict:** Would trial. Would buy if MA is deep-coverage.
**Price reaction:** $79/mo for 22 employees is cheap. Fine.

---

### #97 — Greenway Lawn & Landscape, Birmingham AL
**Owner:** Wade, owner
**Profile:** Lawn care + landscape maintenance, 9 staff, 400 residential accounts, LLC.

**How I'd actually use this:** My wife does the books and would own this. We'd track AL pesticide applicator licenses (mine + my crew leads), AL Dept of Ag commercial applicator renewal, business license, workers comp audit, and vehicle/trailer registrations.

**What works for me:**
- Pesticide applicator CE tracking IF it actually knows AL Dept of Ag's CEU categories — that's the make-or-break
- Workers comp reminder

**What's broken or missing for me:**
- AL pesticide CEU categories (Category 3 ornamental & turf, etc.) and 7 CEU/3 yr minimums won't be in a generic template
- No route/job-level compliance (right-of-way permits in some cities)
- No fleet trailer DOT compliance (I have crews that occasionally cross state line into MS)
- I doubt AL is in the 5 deep-coverage states, so I'm on template fallbacks for everything

**Features I'd pay extra for:**
- Pesticide CEU tracker with state-specific category breakdown

**Verdict:** Would pass unless AL deep coverage + pesticide CEU specific.
**Price reaction:** $79/mo is steep for a service business with this little regulatory surface. $39 sweet spot.

---

### #98 — Beaumont Family Funeral Home, Mobile AL
**Owner:** Robert, owner/funeral director
**Profile:** Family-owned funeral home + crematory, 5 staff (3 FDs, 2 admin), S-corp, 4th generation.

**How I'd actually use this:** My daughter (office manager) would own this entirely. We'd track AL Board of Funeral Service license renewals (mine + 2 other FDs), crematory operator certification, FTC Funeral Rule pricing disclosure compliance, EPA emissions reporting for the crematory, OSHA formaldehyde standard compliance, casket pricing disclosure audits, and our pre-need trust accounting.

**What works for me:**
- A single calendar of board renewals + crematory cert is genuinely valuable — we got cited last year for a lapsed crematory operator cert

**What's broken or missing for me:**
- AL Board of Funeral Service specifics (CE hours, the apprentice/intern reporting) absolutely not in a template
- FTC Funeral Rule compliance is a checklist, not a deadline — needs a different module
- EPA crematory emissions reporting (Title V if we hit thresholds) — extremely niche
- OSHA formaldehyde exposure monitoring schedule
- Pre-need funeral trust account reconciliation (AL requires this) — same family as IOLTA

**Features I'd pay extra for:**
- A "funeral home compliance pack" with FTC + state board + crematory + OSHA formaldehyde
- Pre-need trust reconciliation

**Verdict:** Would pass. Not enough industry-specific coverage. We use NFDA resources + our state board emails.
**Price reaction:** $79/mo is fair pricing if it actually covered funeral home stuff. It doesn't.

---

### #99 — Mid-South Freight, Memphis TN
**Owner:** Dwayne, owner
**Profile:** Local/regional trucking, 14 trucks, 18 staff (15 drivers + 3 admin), USDOT-regulated, S-corp.

**How I'd actually use this:** My safety manager would live in this if it actually did trucking. We'd want USDOT biennial MCS-150 update, IFTA quarterly, IRP annual, UCR annual, drug & alcohol consortium reporting, driver qualification file updates per driver, CDL renewal per driver, medical card per driver, ELD compliance, FMCSA SMS score monitoring, hazmat if applicable.

**What works for me:**
- The shape (centralized compliance calendar) is right for trucking
- Document attach per deadline is useful for DQ files

**What's broken or missing for me:**
- No FMCSA / DOT module at all per your own gap list — this is the entire job for a trucking company
- No ELD integration (Samsara, Motive, KeepTruckin) — that's where DOT compliance actually lives
- No per-driver compliance (CDL, medical card, MVR, drug test, annual review) — 15 drivers × 6 items each is the work
- No IFTA quarterly with state-by-state mileage allocation
- No SMS/CSA score monitoring
- We get a DOT audit every couple years and I'd want this to literally generate the audit package

**Features I'd pay extra for:**
- Full FMCSA module with ELD sync — I'd pay $300/mo on top, easy
- DQ file automation per driver

**Verdict:** Would pass hard. Comes back when DOT/FMCSA exists.
**Price reaction:** $79/mo for trucking-without-DOT is a non-starter. With DOT, $200-400/mo is what J. J. Keller and Foley charge.

---

### #100 — Jorgensen Family Farm, Marshalltown IA
**Owner:** Hank, owner-operator
**Profile:** Row-crop corn/soybean + grain storage, 4 family members + 2 seasonal hands, LLC, 1,400 acres, USDA-regulated, FSA operating loan.

**How I'd actually use this:** Honestly my wife handles the office and our internet at the farm is satellite and slow. We'd want FSA loan reporting, USDA program filings (ARC/PLC enrollment, crop insurance reporting dates), EPA pesticide applicator (private + commercial for one of my hands), OSHA grain handling, IA Dept of Ag renewals, and our LLC annual.

**What works for me:**
- FSA + USDA filing reminders are genuinely the thing my wife misses sometimes
- Pesticide applicator renewal reminder

**What's broken or missing for me:**
- No USDA/FSA module per your own gap list — that's the entire compliance world for a farm
- No crop insurance reporting calendar (sales closing dates, production reporting, claim deadlines)
- No EPA Worker Protection Standard for ag workers (the 2 seasonal hands)
- No OSHA grain bin / confined space tracking
- Email reminders only — my wife responds to text messages from our CPA; she will not check email reliably
- I'd want this on her phone with offline capability — our internet drops constantly during planting/harvest

**Features I'd pay extra for:**
- SMS reminders (you don't have it) — $10/mo more
- USDA/FSA filing prep workflow
- Crop insurance deadline tracking

**Verdict:** Would pass. Farm compliance isn't covered.
**Price reaction:** $79/mo is real money on a row-crop farm. Maybe $25/mo if it actually did FSA/USDA/crop insurance.

---

## Patterns across professional services & specialty

**The two accountants (#81, #82) are the strategic prize but blocked on integration.** Both said the same thing — $299/mo is fair-to-cheap per client, but without Karbon / QBO / TaxDome sync they're double-entering 90-200 clients and won't adopt. White-label needs to go beyond logo (custom domain, branded sending domain). Re-billing the SMB tier to clients with margin is an unmet ask.

**Lawyers (#83, #84) all asked for IOLTA.** No IOLTA = not a serious lawyer tool. MCLE needs hours-by-category, not just a renewal date.

**Licensed professionals (RE brokers, PEs, architects, insurance agents, funeral directors, pesticide applicators) share a pattern:** the calendar shape is right, but generic templates fail on the state-specific CE categories and the industry-specific stuff (trust accounting, crematory cert, COA, appointments, applicator categories). The 5-states-deep coverage is a serious limiter — most of these businesses are in the 46 fallback states.

**Marketing/web/photo (#90, #91, #93) have almost no compliance surface.** Pass or shallow trial. Photographers will laugh.

**SaaS (#92) wants SOC2, not regulatory deadlines.** Vanta/Drata own that wallet. OperatorOS is at best a $79 add-on for DE franchise + BOI.

**Trucking (#99) and farming (#100) need vertical modules (FMCSA, USDA) that don't exist.** Pass entirely until those ship.

**Specialty services (cleaning, lawn, funeral) want workers comp + chemical/SDS + insurance audit tracking** more than they want filing reminders. The audit-prep angle is more compelling than the calendar.
