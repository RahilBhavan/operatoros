# OperatorOS — Buyer Panel Response Plan

> Source: `docs/feedback/100-business-evaluations.md` (100 simulated SMB evaluations across 5 verticals, generated 2026-05-16).
>
> Purpose: convert panel findings into a sequenced, scoped, dependency-aware execution plan. Each workstream maps directly back to a numbered gap and a quoted persona signal. Cuts are explicit. Pricing changes are flagged.
>
> Owner: rbhavanzim@gmail.com · Status: draft for review · Updated 2026-05-16

---

## Reading guide

The plan is organized into **four horizons** plus a cuts section, pricing section, and schema appendix:

| Horizon | Window | Theme | Personas it unlocks |
|---|---|---|---|
| **H0 — Now** | Next 14 days | Positioning, pricing, copy fixes; no shipping required | ~12 (re-positioning unblocks operators who currently see the wrong product) |
| **H1 — Q3 2026** | Next 90 days | Quick-win gap closures: SMS, audit-prep mode, score de-emphasis, state-depth sprint to 10 states, Lite tier | ~30 |
| **H2 — Q4 2026** | Following 90 days | The per-staff axis + healthcare vertical depth + BAA | ~32 |
| **H3 — Q1 2027** | Following 90 days | Construction depth (COI + per-jobsite), accountant channel unblock, multi-location | ~22 |
| **H4 — Q2-Q3 2027** | Following 180 days | Filing-as-a-service (partnership or build); the second vertical module | ~14 |

Numbers are cumulative — by the end of H3 the panel suggests ~74 of 100 are convertible, vs ~38 today. The remaining ~26 are in the explicit-cuts list.

Each workstream specifies: **Goal · Persona evidence · Scope (eng + non-eng) · Acceptance · Effort · Dependencies.**

Effort key: **XS** = 1-3 days · **S** = 1-2 weeks · **M** = 3-4 weeks · **L** = 6-10 weeks · **XL** = 3+ months.

---

## Sequencing principle

> **Do what unlocks the most personas per engineering week, while pacing the content/legal work that runs alongside.**

State-depth and HIPAA-BAA are not engineering bottlenecks — they're content/legal work that runs in parallel and gates feature launches downstream. We sequence engineering to make sure those parallel tracks have somewhere to land.

The two highest-leverage *single* features in the panel — per-staff credential tracking (#1 gap, ~32 personas) and SMS reminders (#3 gap, ~22 personas) — sit in different horizons because per-staff is a 6-10 week build and SMS is a 1-2 week build. SMS goes first to convert as many "would buy with SMS" personas as quickly as possible. Per-staff goes second because it unlocks the largest segment and the engineering cannot start until the membership schema is reshaped (see Schema Appendix).

---

# H0 — Now (next 14 days)

> No code shipping; positioning, pricing, and copy changes that the panel essentially voted for.

## WS-0.1 — Demote the Compliance Score from hero metric

**Goal:** Move the 0–100 compliance score from primary dashboard widget to secondary; foreground a "Next 5 actions" checklist with confirmation-number fields.

**Persona evidence:**
- Diner (#20): *"Gina wants a list, not a number out of 100."*
- Multiple operators in food & retail described the score as "vanity decoration."
- ~0 personas across 100 cited the score as a buying trigger.

**Scope:**
- UI only. Dashboard in `src/app/(app)/dashboard/` reordered.
- Hero widget becomes "Next 5 actions" sourced from `src/lib/deadline-utils.ts` (urgent/upcoming logic already exists).
- Score moves to right rail with a "what is this?" tooltip and a "see history" link.

**Acceptance:**
- First-fold above the dashboard is a checklist with deadline name, agency, due date, and a "log confirmation number" affordance.
- Score widget remains visible but not dominant.
- No schema or RPC changes.

**Effort:** XS (2-3 days). **Dependencies:** none.

---

## WS-0.2 — Foreground the audit share link

**Goal:** Pull "Share with auditor / GC / insurance carrier" out of the share-link submenu and into the dashboard sidebar as a primary action. Add a one-click "send to my insurance broker" template.

**Persona evidence:**
- ~7 personas across healthcare, construction, retail spontaneously cited share links as "this would save me a call." Underweighted in current UI per panel.
- Wedding planner (#94), dental (#41), GC (#21), brewery (#3), jeweler (#65) all mentioned it positively without being asked.

**Scope:**
- UI surface change in `src/app/(app)/dashboard/` and `src/app/(app)/share/`.
- Add three pre-canned share templates: "Insurance carrier" (last 12 months), "Auditor / surveyor" (current state + supporting docs), "General contractor" (active certs only).

**Acceptance:**
- Share-link CTA visible from dashboard without navigation.
- Three templates pre-configure expiry, label, and document filter.
- Existing share-link infra in `src/app/share/[token]/` unchanged.

**Effort:** S (1 week). **Dependencies:** none.

---

## WS-0.3 — Re-tier pricing with a Lite SKU

**Goal:** Add a $39/mo Lite tier (calendar + email reminders + 1 GB storage + no AI / no portal / no share) for thin-compliance operators. Keep Business at $79. Add a $249/mo Vertical placeholder (to be filled when WS-2.x ships).

**Persona evidence:**
- Storage facility (#79), septic (#40), photographer (#93), vintage shop (#64), solo food truck (#2), family farm (#100), Vermont B&B (#10) all explicitly said $79 was too high for their compliance surface and quoted $15–39 as the right number.
- ALF (#60), home health (#59), group mental health (#48), drywall sub (#32) said $79 was *too low* for the right product and they'd pay $250–1,000/mo for vertical depth.

**Scope:**
- Pricing decision (non-eng): confirm tier definitions with legal-copy review pending.
- Stripe configuration: add Lite price ID in `src/lib/stripe.ts`; create entitlement matrix in `src/types/billing` (or wherever current tier types live).
- Feature gating: `src/lib/entitlements.ts` (if exists; create if not) checks Lite tier on AI, accountant portal, share link, document storage cap.
- Onboarding flow update to surface 3 tiers, not 2.

**Acceptance:**
- 3 tiers visible at checkout. Lite users cannot access AI/portal/share/over-1GB storage. Existing Business users grandfathered untouched.
- Stripe webhook handles tier changes both directions.
- Telemetry captures tier mix to verify Lite isn't cannibalizing Business.

**Effort:** S (1-2 weeks including QA). **Dependencies:** none — but pause if business model team wants to test pricing pages first.

---

## WS-0.4 — Honest copy on state coverage

**Goal:** On the marketing site and inside the app, name the 5 deeply-covered states and label the rest as "template coverage (deep curation in progress for your state — see roadmap)" with a state-request form.

**Persona evidence:**
- ~28 personas in template-fallback states explicitly said they'd pass until their state was real. Hiding the gap reads worse than naming it — multiple operators (foundation repair #37, fence #35, B&B #10, brewery #3) said they'd respect transparency.

**Scope:**
- Marketing copy.
- In-app banner on dashboard for template-fallback states linking to the request form and the deep-curation roadmap.
- State-request form posts to existing `waitlist_signups` (or new table) — captures NAICS + state + email + use-case.

**Acceptance:**
- No claim of "50-state coverage" appears anywhere.
- Each template-fallback state has a "request priority curation" CTA whose backlog feeds WS-1.3 sequencing.

**Effort:** XS (3 days). **Dependencies:** none.

---

# H1 — Q3 2026 (next 90 days)

## WS-1.1 — SMS reminders

**Goal:** Add SMS as a reminder channel alongside email, with opt-in per user and per-deadline severity controls. Twilio backend, $10/mo upsell on Business or included on a new Pro tier.

**Persona evidence (~22 personas):**
- Food truck (#2): *"Email reminders will be missed; SMS is non-negotiable."*
- B&B (#10), septic (#40), farmer (#100), pizza shop (#16), painter (#28), salon stylists (#51), nail salon (#52), tattoo studio (#54), arborist (#33), locksmith (#78), mover (#80), lawn care (#97), photographer (#93), and 9+ others.
- Especially loud from owner-operators and field workers.

**Scope:**
- Twilio integration in `src/lib/sms.ts` (new) — mirror the Resend pattern in `src/lib/email.ts` (or wherever existing email lives).
- New cron extension in `src/app/api/cron/reminders/` to fan out SMS at T-7 / T-1 / overdue (T-30 stays email-only — SMS gets noisy at 30 days).
- Schema: `notification_preferences` table per user (channel, severity threshold, quiet hours, opt-in timestamp for TCPA compliance) and a `sms_log` table for delivery audit.
- UI: Settings → Notifications page with per-channel toggles, phone verification flow (Twilio Verify or send-code-to-yourself), quiet hours.
- TCPA compliance: explicit opt-in checkbox at phone capture, STOP/HELP handlers, unsubscribe in every message, message frequency disclosure.

**Acceptance:**
- User can enable SMS for any combination of severity levels.
- Phone number verified before first send.
- STOP / HELP correctly disable / explain.
- SMS log queryable in admin for delivery debugging.
- Per-message cost capped via Twilio budget alerts.

**Effort:** S-M (2-3 weeks including TCPA + verification). **Dependencies:** Twilio account; legal sign-off on TCPA opt-in copy.

---

## WS-1.2 — Audit-prep mode

**Goal:** A discrete workflow that pulls together a binder for an inbound surveyor/inspector/auditor visit: relevant deadlines for the agency, supporting documents, score over time, share-link with auditor-specific scope.

**Persona evidence (~7 personas, highest willingness-to-pay in panel):**
- ALF administrator (#60): *"Survey-prep mode (pulls together the document binder a surveyor will request) — I'd pay extra."*
- Daycare (#58), dental (#41), home health (#59), group mental health (#48), body shop (#71), dispensary (#66) all named this as a discrete workflow.

**Scope:**
- New page `src/app/(app)/audit-prep/` with "start a binder" wizard: pick agency / inspection type → tool surfaces relevant deadlines + suggests documents → user confirms → generates a curated share link with a date-locked snapshot.
- Schema: `audit_binders` table (id, business_id, agency, scope, created_at, share_token_id, status).
- Reuse existing `share_links` infra in `src/app/share/[token]/` — audit binder is a typed share with extra metadata.
- PDF export reuse from `src/app/api/export/pdf/route.ts`.

**Acceptance:**
- User can create, label, and snapshot a binder.
- Snapshotted binders are immutable (defends against post-survey edits).
- Surveyor-side URL shows agency-scoped deadlines + attached docs with read-only banner.

**Effort:** M (3-4 weeks). **Dependencies:** WS-0.2 (share-link foregrounding — same surface area).

---

## WS-1.3 — State depth: 5 → 12 states

**Goal:** Move 7 high-priority states from template fallback to deep curation. Picks driven by SMB density × persona request volume × NAICS coverage breadth: **CA, TX, FL, NY, IL, PA, GA**.

**Persona evidence (~28 personas):**
- Quoted gap #2. Multiple panelists in all 7 target states explicitly said "I'd buy if my state was real."

**Scope (mostly content, not engineering):**
- Per state: enumerate top 12 NAICS verticals × entity types × jurisdiction levels (state + county where county matters — TX/CA/FL/IL particularly).
- Source: official SoS sites, state agency calendars, AICPA state-tax guides, OSHA state-plan rosters.
- Curate into `regulatory_rules` via existing admin write path (`src/app/api/admin/rules/[id]/edit/route.ts`).
- Cite every rule (existing schema supports this).
- Versioning already exists per `supabase/migrations/20260516000006_version_regulatory_rule_rpc.sql`.

**Engineering scope:**
- Admin UX improvements for batch rule entry (CSV import? form templates?) — 1 week.
- Per-state coverage indicator on the dashboard ("Your state: ✅ Deep coverage / ⚠️ Template").
- Automated diff against the prior version when sources change.

**Acceptance:**
- 7 new states promoted from template to deep.
- Each has at minimum: state annual report, sales tax cadence, payroll tax cadence, workers comp, top 5 industry licenses.
- Each rule cites the source URL + last-verified date.

**Effort:** L (8-10 weeks at 1 FTE researcher + 0.25 FTE engineer). **Dependencies:** Hire or contract a compliance researcher (non-eng hire).

---

## WS-1.4 — AI insights presentation polish

**Goal:** The feature got muted reaction in the panel. Citations and source links got positive comments; vague AI text was ignored. Lean harder into the citation surface and add a "verify with my accountant" one-click action.

**Persona evidence:**
- ~0 raves. ~3 explicit "ignored it." But citation-forward operators (jeweler #65, brewery #3, distillery #18, lawyer #84) said citations + source URLs were what made them trust it.

**Scope:**
- UI in `src/app/(app)/dashboard/` and wherever insights render: lead with the source agency, then the obligation, then the rationale. Strip prose-y AI voice.
- Add "share this insight with my accountant" → fires email via Resend to the accountant on file with insight body + source URL.
- Add user-visible "last refreshed" timestamp (uses existing `ai_insight_cache` TTL).
- No model or RPC changes (`try_consume_ai_rate_limit` stays).

**Acceptance:**
- Every insight visually anchors on the source agency.
- "Share with accountant" works end-to-end.
- Insights without a citation are visually downgraded or filtered.

**Effort:** S (1 week). **Dependencies:** none.

---

## WS-1.5 — Activate Lite tier in onboarding

**Goal:** Surface Lite tier prominently for NAICS codes the panel identified as thin-compliance (photography, storage, vintage retail, mobile services, single-person shops).

**Persona evidence:** WS-0.3 list. **Scope:** Onboarding fork after NAICS + headcount; if (employees ≤ 2 AND industry in thin-compliance allowlist) → suggest Lite first.

**Effort:** XS (2 days). **Dependencies:** WS-0.3.

---

**H1 sub-total:** ~30 personas unlocked or converted.

---

# H2 — Q4 2026 (90 days)

## WS-2.1 — Per-staff credential tracking (the biggest single bet)

**Goal:** Add the second axis to the data model: a *staff member* can hold *credentials* each with their own renewal cycle. The deadline calendar surfaces staff-cycle deadlines alongside entity-cycle deadlines.

**Persona evidence (~32 personas, #1 gap in panel):**
- ALF (#60): *"12 caregivers each with fingerprint cards, TB tests, Article 9 training, CPR/First Aid, fall prevention, dementia training, med tech cert. Not optional."*
- Dental (#41), PT clinic (#43), group mental health (#48), derm (#50), salon chain (#51, #53), tattoo (#54), daycare (#58), home health (#59).
- Construction side: electrician (#22), plumber (#23), HVAC (#24), solar (#29), demo (#38) — all need per-tech 608 / NABCEP / OSHA 10/30 / asbestos worker.
- Retail: auto repair (#70) needs 608 + ASE, body shop (#71) needs respirator fit-test, liquor (#68) needs TIPS, mover (#80) needs DQ file per driver.

**Scope (engineering — this is the largest H2 build):**
- Schema (new tables; see Schema Appendix):
  - `staff_members` (id, business_id, full_name, email, role, employment_type W2/1099, hire_date, end_date, fk to optional user_id if they have an OS account)
  - `credential_types` (id, name, agency, cite_url, default_validity_days, jurisdiction, vertical_tag) — reuse `regulatory_rules` patterns
  - `staff_credentials` (id, staff_member_id, credential_type_id, issued_date, expires_date, status, document_id fk, last_verified_at)
  - `credential_renewals_log` (audit trail of renewals + reminders sent)
- Reminders cron extension to fan out per-staff-credential deadlines (T-30/T-7/T-1/overdue) alongside entity deadlines.
- UI: new "Staff" section in app — list view + per-staff page with credential matrix.
- Admin: import flow (CSV or paste) for businesses with 10+ staff.
- Entitlements: per-staff tracking gated to Business + Vertical tiers (not Lite).

**Non-engineering:**
- Seed `credential_types` library for healthcare (RN, CNA, LPN, CPR, BLS, OSHA bloodborne, food handler, CE per state board) and construction (608 I-IV, NABCEP, OSHA 10/30/40, RRP, asbestos worker O&M class, EPA WPS). Approx 200 credential types to seed.
- Per-vertical credential matrices to ship alongside (so a daycare onboarding doesn't have to manually add 12 caregivers × 8 credentials).

**Acceptance:**
- A daycare with 22 staff can onboard their full credential matrix in <30 minutes.
- Per-staff expiry reminders fire correctly across both email and SMS (WS-1.1 dependency).
- Compliance score weights per-staff credentials correctly (overdue staff cert = -10 per occurrence; rebalance with care).
- Per-staff data is RLS-protected to business_id consistent with current tenant model.

**Effort:** L (8-10 weeks). **Dependencies:** WS-1.1 (SMS for renewal reminders); credential-type content seeding (1 FTE compliance researcher overlap with WS-1.3).

---

## WS-2.2 — HIPAA BAA + technical attestations

**Goal:** Sign a BAA with customers in healthcare verticals. Requires legal deliverable, technical control attestations, audit logging, incident response procedure.

**Persona evidence (~9 healthcare personas — gating block, not preference):**
- Dental (#41), PT (#43), chiro (#44), med spa (#45), derm (#50), mental health (#48), optometry (#49), home health (#59), ALF (#60) — none can legally store PHI-adjacent documents without a signed BAA.

**Scope:**
- Legal: contract a healthcare data attorney to draft BAA template ($5–15K outside fee). Not LLM-generated.
- Technical attestations: confirm encryption at rest (Supabase Storage covers), encryption in transit (TLS 1.2+), access logs (already have), audit trail of PHI access, breach notification procedure (60 days per HIPAA).
- Business associate roles: Supabase, Resend, Twilio, Anthropic, Stripe — each needs their own BAA on file with us (Supabase BAA available on Pro/Team; Anthropic offers BAA on Claude on Bedrock or via direct agreement; Resend / Twilio offer; Stripe partial).
- Schema: `phi_access_log` table — append-only, captures who accessed which document for which business, when.
- UI: customer-facing BAA acceptance flow at onboarding for healthcare NAICS; signed BAA stored.
- Sub-processor list page publicly available.

**Acceptance:**
- Customer in a healthcare NAICS sees BAA acceptance modal at onboarding.
- Signed BAAs stored per business.
- PHI access logged per Supabase RLS-aware audit pattern.
- All sub-processor BAAs on file.
- Incident response runbook documented internally.

**Effort:** XL (10-14 weeks including legal turnaround and sub-processor negotiations). **Dependencies:** legal counsel; Supabase plan tier with BAA support; potentially upgrade to Anthropic Bedrock or direct BAA.

---

## WS-2.3 — CE/CEU tracking per practitioner

**Goal:** Extension of WS-2.1. Per practitioner: required CE hours per cycle, broken out by category (general / ethics / specialty), with credit logs.

**Persona evidence:**
- Mental health group (#48): *"CE per clinician across 7 licenses across 4 states is what kills me."*
- Optometry (#49), derm (#50), nurses across home health (#59), CPAs in WS-5 (#81, #82), insurance agent (#85), real estate broker (#86), architects (#88), engineers (#89), funeral home (#98).

**Scope:**
- Schema: `ce_requirements` (credential_type_id, period_months, hours_required, category_breakdown_json), `ce_credits` (staff_credential_id, hours, category, source_url, completed_at, document_id).
- UI: per-staff page gains a CE tab showing progress bars by category.
- Reminders when % of cycle elapsed > % credits earned.

**Acceptance:**
- For a mental-health LCSW in CO with 40-hour cycle (4 ethics required), the dashboard shows hours-earned / hours-needed and flags shortfall.
- Can attach CE completion certificate (PDF) to a credit log.

**Effort:** M (3-4 weeks). **Dependencies:** WS-2.1 schema landed.

---

## WS-2.4 — First practice-management integration (SimplePractice OR Mindbody)

**Goal:** Pick one and ship a deep integration. Auto-sync staff roster, license expiry dates pulled from the source system, no double-entry.

**Persona evidence (~9 healthcare + service personas):**
- Mental health group (#48): *"Without SimplePractice sync I'm double-entering 7 clinicians."*
- Massage (#46), yoga (#56), pilates (#57), salon (#51), nail (#52), barbershop (#53), pet groomer-bundled (#63).

**Recommendation:** Ship **SimplePractice** first — healthcare-aligned, BAA-aligned, smaller integration surface than Mindbody, customers who already trust it for PHI will trust us if we BAA-paired.

**Scope:**
- OAuth into SimplePractice (their API supports it).
- Mirror staff list and credential fields where present.
- Webhook for staff add/remove.
- Settings → Integrations page with connect/disconnect.

**Acceptance:**
- Mental-health group connects SimplePractice; their 7 clinicians appear in OperatorOS within 60 seconds with current license expiry dates pre-filled.
- Disconnect removes nothing — just stops syncing.

**Effort:** M (4 weeks). **Dependencies:** WS-2.1 (staff schema), WS-2.2 (BAA — SimplePractice will require we have one).

---

## WS-2.5 — State depth: 12 → 20 states

**Goal:** Add **OH, NC, NJ, MI, WA, MA, VA, AZ**.

**Same shape as WS-1.3.** Effort: L (continuing in parallel with WS-2.1-2.4). Dependencies: same researcher.

---

**H2 sub-total:** ~32 personas converted, primarily across healthcare and per-staff-heavy verticals.

---

# H3 — Q1 2027 (90 days)

## WS-3.1 — COI generation + auto-distribution

**Goal:** Generate a Certificate of Insurance (ACORD 25) on demand, with named additional insureds, and auto-distribute via email or share-link to GCs, owners, HOAs, property managers.

**Persona evidence (~11 construction + service personas):**
- GC (#21): *"COI per job per GC is the workflow I'd pay extra for."*
- Plumber (#23): *"I chase certs every week from my insurance broker."*
- Roofer (#25), painter (#28), solar (#29), concrete (#30), HVAC (#24), mason (#39), tree service (#33), mover (#80), cleaning (#96).

**Scope:**
- Integration with one or two insurance carrier portals or broker APIs to auto-generate ACORD 25s — OR — start with a manual flow: user uploads master COI, OS handles named-insured templating and distribution.
- Schema: `coi_recipients` table (name, email, address, requirements, recurring boolean), `coi_issues` (date, recipient_id, doc_id, expiry).
- Workflow: pick recipient → pick coverage requirements → pick effective dates → either issue from carrier API or attach + send manual COI.
- Reminder cron: COI expiry T-30/T-7 fires to user with "renew with broker" + to each recipient.
- Distribution: email with PDF + ShareLink alternative for downstream auto-verify.

**Recommendation:** Start with the manual workflow (no carrier API). The value is in the *distribution and tracking*, not generating the PDF. Carrier integration is a v2.

**Acceptance:**
- GC can list 12 named additional insureds and send their current COI to all of them in one action.
- T-30 expiry alert fires to GC and all recipients.
- Recipients receive a share-link they can re-pull at any time without contacting the GC.

**Effort:** M-L (6-8 weeks for manual flow; carrier API is a separate L-XL). **Dependencies:** none — but pairs naturally with WS-2.1 staff credentials (covers individual workers comp / professional liability where applicable).

---

## WS-3.2 — Per-jobsite / per-project tracking

**Goal:** Construction GCs, electricians, plumbers, HVAC all have project-shaped compliance (permits, 811 dig tickets, SWPPP inspections, lien deadlines, certified payroll). Add a `projects` axis.

**Persona evidence (~9 construction personas):**
- GC (#21): *"My compliance is per-job, not per-quarter."*
- Solar (#29) on per-system permit closeout, excavation (#34) on SWPPP, demo (#38) on per-project NESHAP notifications, mason (#39) on per-job certified payroll, foundation repair (#37).

**Scope:**
- Schema: `projects` (id, business_id, name, address, customer_name, start_date, end_date, status, value, gc_business_name), `project_deadlines` (project_id, deadline_template_id, due_date, status), `project_documents` (project_id, document_id).
- UI: new "Projects" section. Per-project page with deadline list, document attach, COI distribution (WS-3.1 integration), close-out checklist.
- Templates per trade: GC remodel, GC new-build, solar install, excavation site, demo project — each pre-seeds a project's deadline list.
- Multi-state — projects can have a jurisdiction different from the business HQ.

**Acceptance:**
- A GC with 8 active projects sees one row per project on the new Projects index, with status indicators per project.
- Per-project close-out triggers a final compliance check (lien filings done, COIs delivered, permits signed off).

**Effort:** L (6-8 weeks). **Dependencies:** WS-3.1 (COI per project).

---

## WS-3.3 — Accountant channel unblock: Karbon + QBO Online sync

**Goal:** Two highest-leverage accountant integrations. Sync client list both directions; pull QBO chart-of-accounts metadata to seed sales-tax / payroll-tax cadences without manual entry.

**Persona evidence (the strategic channel):**
- Solo CPA (#81): *"$299 is fair-to-cheap per client, but without Karbon sync I'm double-entering 90 clients and won't adopt."*
- 5-person bookkeeping firm (#82): *"All 200+ clients are in QBO. Manual onboarding 200 entities is the entire reason I haven't bought."*

**Scope:**
- Karbon integration: OAuth, client list pull, action-item write-back (OS-flagged overdue deadlines appear as Karbon tasks in the accountant's workflow).
- QBO Online integration: OAuth, entity metadata pull (NAICS, state, entity type, employee count via Gusto/QBO Payroll link).
- Bulk onboarding flow: accountant pastes or syncs client list → OS auto-onboards each with seeded deadlines → accountant reviews and confirms.
- White-label: custom URL (CNAME), custom sending domain (Resend custom domain), custom logo on emails and PDFs.
- Re-billing: accountant tier can issue a "client subscription" at a margin — OS bills the accountant, accountant bills the client.

**Acceptance:**
- Solo CPA (#81) can onboard 90 clients in under 4 hours and have OS managing all their deadlines.
- White-label custom domain works end-to-end.
- Accountant can mark up client billing with built-in margin display.

**Effort:** XL (10-14 weeks including white-label + billing). **Dependencies:** Karbon + Intuit Developer accounts; Resend custom-domain plan tier.

---

## WS-3.4 — Multi-location / multi-entity dashboard

**Goal:** A user can own multiple businesses or locations, with an aggregator view.

**Persona evidence (~9 personas):**
- Coffee chain (#4), laundromat chain (#76), barbershop chain (#53), brewery+taproom (#3), pizza+second-loc (#16), dispensary (#66) per-loc state licenses, salon (#51), B&B (#10), boutique hotel (#11).

**Scope:**
- Schema: `locations` table (id, business_id, name, address, jurisdiction, open_date, close_date) — many locations to one business.
- All deadlines can attach to entity OR to location.
- Pricing: existing $79 covers up to 3 locations; +$25/mo per additional location (panel quotes support this).
- Aggregator dashboard for multi-location businesses: roll-up score, per-location score, per-location overdue items.

**Acceptance:**
- Laundromat chain (#76) with 3 locations sees one OS account at $79+$50/mo with 3 location dashboards rolling into one.
- Per-location deadlines route reminders to the per-location contact, not just the business owner.

**Effort:** M-L (5-6 weeks). **Dependencies:** Pricing decision (WS-0.3 multi-loc add-on).

---

## WS-3.5 — PWA + offline for read-only

**Goal:** Make the dashboard work as a Progressive Web App with offline read of upcoming deadlines and attached docs. Skip native iOS/Android for now.

**Persona evidence (~14 field-worker personas):**
- Septic (#40), food truck (#2), arborist (#33), locksmith (#78), mobile car wash (#95), lawn care (#97), farm (#100, satellite internet), mover-driver-facing (#80), GC site visits (#21).

**Scope:**
- Service worker for offline caching of last-7-day dashboard state.
- IndexedDB for cached deadlines + documents (with size cap and refresh-on-reconnect).
- "Add to home screen" prompting after 3 sessions.
- No write while offline (avoids conflict-resolution complexity).

**Acceptance:**
- Field user can pull up their next 30 days of deadlines and any attached document with zero connectivity.
- App auto-syncs on reconnect.

**Effort:** M (3-4 weeks). **Dependencies:** none.

---

## WS-3.6 — State depth: 20 → 30 states

**Same shape as WS-1.3 / WS-2.5.** Add **TN, IN, MO, MD, MN, WI, CO, OR, MN, CT**. Effort: L (continuing). 

---

**H3 sub-total:** ~22 additional personas converted, primarily construction, accountant channel, and multi-location operators.

---

# H4 — Q2-Q3 2027 (180 days)

## WS-4.1 — Filing-as-a-service: partnership-first

**Goal:** OS actually *files* the highest-volume deadlines on the customer's behalf for a per-filing fee. Don't build from scratch — partner with **Harbor Compliance** or **LicenseLogix** for state annual reports and business licenses; build the integration; mark up.

**Persona evidence (~14 personas):**
- Sushi (#13): *"I'd pay $200 to never think about my MA annual report again."*
- Brewery (#3), distillery (#18), wedding planner (#94), dental (#41), GC (#21), foundation repair (#37), funeral home (#98).

**Initial filings to support:**
- FinCEN BOI report (universal, federal).
- Delaware franchise tax (every DE-incorporated entity).
- State annual / biennial reports (50-state — partner does the work).
- Top-5 industry licenses by volume (food handler, liquor renewal where state allows, contractor license renewal).

**Scope:**
- Partnership negotiation (non-eng).
- Integration with partner's API.
- Per-filing pricing surfaced inline ("Renew now for $89") on the deadline detail page.
- Stripe one-time charges for filings, separate from subscription.
- Status pull-back: confirmation numbers, filed-date, return docs auto-attached to the OS deadline.

**Acceptance:**
- A customer can click "File this for me" on at least 4 of their tracked deadlines and pay with one click.
- Filing status updates without manual user check.
- Net revenue per filing (partner cost + OS margin) is positive.

**Effort:** XL (12-16 weeks including partnership). **Dependencies:** Partner agreement; Stripe one-time-charge flow.

---

## WS-4.2 — Second vertical depth: pick CONSTRUCTION

**Goal:** Beyond COI + per-jobsite, ship the depth that makes OS the *category SaaS* for residential / light-commercial construction: certified payroll, prevailing wage, OSHA 300 log, EPA RRP, asbestos worker tracker, lien deadlines per state.

**Persona evidence:**
- Drywall sub (#32, mostly 1099) wants certified payroll.
- Demo (#38) wants asbestos worker matrix + NESHAP per-job.
- Mason (#39, union) wants prevailing wage + certified payroll integration with LCPtracker (which they currently pay separately for).
- All trades want a per-tech 608 / NABCEP / RRP / OSHA matrix (WS-2.1 covers partially; construction-specific cycles need depth).

**Scope:** OSHA 300 log workflow; certified payroll template per state (CA DIR, federal Davis-Bacon); per-job lien deadline calculator; pre-built credential matrices for the top 8 trades; integration target list (Foundation, BuilderTrend, Procore — pick one).

**Acceptance:** A 14-employee GC with 8 projects can run their entire compliance + COI + certified payroll + lien tracking from OS.

**Effort:** XL (12-16 weeks). **Dependencies:** WS-2.1 (per-staff), WS-3.1 (COI), WS-3.2 (per-jobsite).

---

## WS-4.3 — State depth: 30 → 40 states

**Effort:** L (continuing).

---

**H4 sub-total:** ~14 additional personas converted (especially construction GCs and high-volume filers).

---

# Explicit cuts — we are NOT building these

The panel surfaced legitimate needs we are choosing not to pursue. Each has a strong incumbent or is a wrong-shape investment.

| Cut | Personas affected | Why we cut | If we change our mind |
|---|---|---|---|
| **DOT/FMCSA module** | #80 mover, #99 trucking, #33 arborist, #40 septic | A vertical SaaS in itself. J.J. Keller, Foley, Whip Around own this. Cost of entry is matching their depth across UCR / IFTA / IRP / DQ files / drug consortium / ELD / MCS-150. | Partnership with Foley to white-label later. |
| **USDA/FSA farming module** | #100 family farm | Too narrow a US segment; FSA is a federal lender + has its own portals; rural broadband is a UX block. | Defer indefinitely; refer to AgriWebb or FarmRaise. |
| **METRC / cannabis depth** | #66 dispensary | Federal banking + 280E + state Metrc track-and-trace is a vertical SaaS. Cova, Flowhub, Dutchie own it. Plus regulatory exposure risk. | Stay surface-level (calendar + docs only); reseller channel into existing cannabis tools. |
| **ATF 4473 / A&D book** | #69 FFL, #77 pawn | Operators explicitly will not put 4473s in the cloud. Trust gap, not feature gap. | Local-only document mode could revisit. |
| **SOC2 / ISO27001 framework** | #92 SaaS startup | Vanta / Drata / Secureframe own the wallet at $500-2,000/mo. Adjacent to compliance but a different problem (controls library, not deadline calendar). | Integration with Vanta for SaaS customers who want both could be a partnership later. |
| **IOLTA trust accounting** | #83, #84 lawyers | LawPay, Clio, MyCase own legal trust accounting. We won't do this well as a side feature. | Add a deadline category for IOLTA reconciliation and partner with Clio for the heavy lifting. |
| **Native iOS / Android app** | ~14 field workers | PWA (WS-3.5) covers 80% of the value. Native is a 3+ FTE team. | Revisit after Series A. |
| **Avalara-style sales tax automation** | #61 boutique, #67 vape | Avalara owns this. Our pricing is wrong for it. | Integration to pull tax-cadence metadata from Avalara could be useful. |
| **Resale certificate management** | #61 boutique, #74 bicycle | Niche workflow. Skip. | None planned. |
| **Per-event compliance (catering, wedding)** | #6 catering, #17 mobile bar | The mental model is project-shaped (WS-3.2) but per-event is more granular than per-project. Hospitality side is small enough we route them to WS-3.2 with documentation. | Evaluate after WS-3.2 ships. |

---

# Pricing changes (consolidated)

| Tier | Now | Proposed | Notes |
|---|---|---|---|
| **Lite** | — | **$39/mo** | Calendar + email reminders + 1 GB storage. No AI, no portal, no share. WS-0.3. |
| **Business** | $79/mo | $79/mo | Unchanged. 3 locations included; $25/mo per add'l location after WS-3.4. |
| **Vertical** | — | **$249/mo** | Business + per-staff matrix (WS-2.1) + CE tracking (WS-2.3) + audit-prep (WS-1.2) + vertical-specific credential libraries + practice-mgmt integration (WS-2.4). For healthcare-tier customers initially. |
| **Construction** | — | **$199/mo** | Business + COI distribution (WS-3.1) + per-jobsite (WS-3.2) + per-trade credential matrices. Ships with H4. |
| **Accountant** | $299/mo | $299/mo + integration fees pass-through | Unchanged headline; H3 unblocks adoption. White-label + Karbon + QBO. |
| **Filings (one-time)** | — | **$89–$249 per filing** | A la carte, on top of any tier. H4. |

**Implication:** ARPU mix shifts. Today $79 blended. Post-H3 modeled blend across the panel: Lite 12% × $39 + Business 48% × $79 + Vertical 18% × $249 + Construction 14% × $199 + Accountant clients 8% × $79 wholesale = **~$113/mo per end-customer**, +43% on current ARPU at +0% CAC.

---

# Schema appendix — new tables required

| Workstream | Table | Purpose |
|---|---|---|
| WS-1.1 SMS | `notification_preferences` | Per-user channel + severity + quiet hours + TCPA opt-in. |
| WS-1.1 SMS | `sms_log` | Delivery audit + cost tracking. |
| WS-1.2 Audit-prep | `audit_binders` | Snapshotted, agency-scoped share. |
| WS-2.1 Per-staff | `staff_members` | Roster per business. |
| WS-2.1 Per-staff | `credential_types` | Library (cross-tenant). |
| WS-2.1 Per-staff | `staff_credentials` | Many-to-many with expiry. |
| WS-2.1 Per-staff | `credential_renewals_log` | Audit trail. |
| WS-2.2 BAA | `phi_access_log` | Append-only; PHI access trail. |
| WS-2.2 BAA | `business_associate_agreements` | Signed BAAs per business. |
| WS-2.3 CE | `ce_requirements` | Per-credential CE rules. |
| WS-2.3 CE | `ce_credits` | Per-credit logs. |
| WS-3.1 COI | `coi_recipients` | GCs / owners / HOAs. |
| WS-3.1 COI | `coi_issues` | History of distributions. |
| WS-3.2 Projects | `projects` | Per-job entity. |
| WS-3.2 Projects | `project_deadlines` | Project-scoped deadlines. |
| WS-3.4 Multi-loc | `locations` | Many-per-business. |
| WS-3.4 Multi-loc | `location_deadlines` | Either business- or location-scoped. |

Migration count: ~15-20 new migrations across H1-H3. All RLS-protected to business_id consistent with current tenant model.

---

# Hiring implied by the plan

- **1 compliance researcher (FTE or 0.75 FTE contract)** — H1 start, continues through H4. Owns state-by-state rule curation, credential-type library, certified-payroll templates, partner-filing rules. Non-eng but load-bearing.
- **1 senior full-stack engineer** — H2 start. Needed once WS-2.1 begins; current founder cannot ship per-staff + BAA + COI + projects + multi-loc + PWA + integrations solo across 12 months.
- **1 healthcare data attorney (contract)** — Q4 2026 start. WS-2.2 BAA + sub-processor BAAs.
- **1 partnership-development BDR (part-time or fractional)** — Q1 2027. Karbon, Intuit, SimplePractice, Harbor Compliance / LicenseLogix.

Total H1-H4 hiring cost: ~$650K-$900K annualized including contractors. Funded by H3 ARR growth (modeled) or seed round.

---

# Telemetry / success metrics per workstream

Every workstream gets one *user-observable* success metric and one *internal* metric.

| WS | User metric | Internal metric |
|---|---|---|
| 0.1 score demote | Time-on-dashboard up (engagement, not bounce) | Click-through on "Next 5 actions" tile |
| 0.2 share-link foreground | Share-link creation rate +50% in 30d | Share-link clicks per business |
| 0.3 Lite tier | Conversion from trial to Lite tier > 25% for thin-compliance NAICS | Cannibalization rate of Business by Lite < 10% |
| 1.1 SMS | SMS opt-in rate > 40% of Business+ tier within 60d | Twilio cost per business < $1.50/mo |
| 1.2 Audit-prep | Audit binders created per surveyor-bearing vertical (healthcare, ALF, daycare) | # personas converted via audit-prep upsell |
| 1.3 State depth (12) | Conversion rate in the 7 new states up 2-3x | Rules per state, citation freshness |
| 2.1 Per-staff | % of Business+ customers with > 5 staff entered within 30d of feature launch > 50% | Per-staff renewal reminder send count |
| 2.2 BAA | 100% of healthcare onboardings have BAA signed | Sub-processor BAA coverage 100% |
| 2.4 SimplePractice | % of mental health / massage / wellness customers connected > 60% | Sync error rate < 1% |
| 3.1 COI | COI distributions per contractor per month > 4 | Recipient share-link clicks per COI |
| 3.3 Accountant | Active Accountant tier customers up 5x in 90d post-launch | Clients per accountant tier customer > 30 |
| 3.4 Multi-loc | Multi-loc customers > 15% of Business+ tier | $/business ARPU on multi-loc up 30% |
| 4.1 Filings | Filings revenue > 15% of MRR within 90d | Filing margin > 35% |

---

# Open questions for the founder

1. **Founder bandwidth.** H1 alone is ~6-8 weeks of solo founder time. Hiring the senior engineer earlier (Q3 instead of Q4) accelerates H2-H3 by 1-2 quarters. Funded?
2. **Which one to ship first for vertical depth — healthcare or construction?** The plan picks healthcare in H2 because of HIPAA BAA timing and SimplePractice partnership availability. If the actual go-to-market is construction-first (because the founder is closer to that audience), swap H2/H4 contents.
3. **Filing-as-a-service: partner or build?** Plan assumes partner. Build-from-scratch is XL+ per filing type and a different company shape (regulatory operations). Confirm partnership openness before WS-4.1.
4. **The Accountant tier — pre-seed it with design partners?** The 5 design-partner accountants in the seven-year stage-gate plan should be courted *now* (H0/H1) so WS-3.3 ships with confirmed adopters waiting.
5. **State-depth curation: in-house researcher vs. contract a CPA/Bookkeeper bench?** Cheaper variable cost via contract bench (e.g. AICPA freelancers) but slower iteration.

---

# How to use this plan

- Each workstream is independently scoped. Re-sequence freely based on hiring + cash. The horizon labels are guidance, not contract.
- Effort estimates assume a senior engineer + the founder + the listed contract roles. They double if the founder ships alone.
- Persona unlock counts are *upper bounds* — the actual conversion rate depends on price, UX execution, and whether the panel signal generalizes.
- Cuts are revisitable. Each cut is documented with a "if we change our mind" path so we don't relitigate quarterly.
- The Schema Appendix should be reviewed before any of the migrations land — naming and RLS patterns should match existing `regulatory_rules` / `memberships` / `share_links` conventions, not invent new ones.

**Next concrete step (this week):** review WS-0.1 through WS-0.4 (no-engineering changes) and approve or reject. Those four take the panel from ~38 convertible to ~50 convertible without writing a line of code.
