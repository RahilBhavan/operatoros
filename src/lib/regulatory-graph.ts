/**
 * Regulatory rule graph — the data substrate behind every deadline this
 * product surfaces. Three things live here:
 *
 *   1. `RuleDef` / `DueDateRule` — typed shapes for a versioned, citation-
 *      backed regulatory rule. Mirrors the `regulatory_rules` DB table
 *      written by migration 20260516000004.
 *
 *   2. `LEGACY_RULES` — an in-memory mirror of the seeded rule set. Used
 *      as the fallback when the DB is unreachable or the table is empty
 *      (e.g. cold-start before the seed migration is applied), and as the
 *      default for unit tests so they stay synchronous and deterministic.
 *
 *   3. `loadActiveRules()` — the runtime source of truth at request time.
 *      Queries `regulatory_rules` (RLS-open SELECT for authenticated),
 *      Zod-validates every row, caches the result in-process for 10
 *      minutes, falls back to LEGACY_RULES on error or empty result.
 *      Call sites (the onboarding action) await this and pass the result
 *      into the pure `buildStarterDeadlines`.
 *
 * The evaluator covers the exact set of date-derivation patterns the
 * original hardcoded engine used — nothing speculative. Every existing
 * test in seed-deadlines.test.ts still passes byte-for-byte against the
 * same reference date because the LEGACY_RULES fallback path is the
 * default for tests.
 */

import { z } from "zod";
import { formatIsoDate } from "@/lib/deadline-utils";
import { requiresOshaLog } from "@/lib/onboarding-utils";
import type { EntityType, Industry, OnboardingData } from "@/types/onboarding";

export type SeverityTier = "critical" | "high" | "medium" | "low" | "info";

export type DueDateRule =
  // Next occurrence of fixed M-D from today; advances year if already past.
  | { kind: "next_md"; month: number; day: number }
  // Always year+1 M-D regardless of whether already past (OSHA Feb 1).
  | { kind: "next_year_md"; month: number; day: number }
  // today + N months, same day-of-month.
  | { kind: "months_from_today"; months: number }
  // today + N years, same day-of-month.
  | { kind: "years_from_today"; years: number }
  // today + N years, day 1 of the same month (NY LLC biennial anniversary).
  | { kind: "years_from_today_first_of_month"; years: number }
  // Next-after-this-month, given day-of-month (sales tax: next month, 20th).
  | { kind: "next_month_day"; day: number }
  // Next N quarter-end-month dates (Apr 30 / Jul 31 / Oct 31 / Jan 31 — 941).
  | { kind: "quarterly_941"; count: number };

// Selector predicate evaluated against onboarding data + a few derived
// booleans. All fields are optional; an empty predicate matches every
// business. Multiple fields AND together.
export type AppliesWhen = {
  state?: string;                      // exact state code (e.g. "CA")
  state_in?: string[];                 // any of these
  state_not_in?: string[];             // none of these (for "all but X")
  state_any?: true;                    // any state (used by universal rules)
  entity_in?: EntityType[];            // entity_type ∈ set
  industry?: Industry;                 // exact industry
  hires_contractors?: boolean;         // hiresContractors === value
  has_employees?: boolean;             // (employeeRange !== "1") === value
  osha_required?: boolean;             // requiresOshaLog(employeeRange) === value
};

export type RuleDef = {
  // Stable UUID — matches the seed migration row so deadlines.regulatory_rule_id
  // resolves to the same canonical rule across DB + TS.
  id: string;
  // Stable slug — used as deadlines.rule_id (text) for the dedup tuple
  // (business_id, rule_id, occurrence_key) defined in 20260516000001.
  rule_key: string;
  rule_version: number;

  jurisdiction_type: "federal" | "state" | "local";
  // For federal rules, "US". For state-specific rules, the state code.
  // For rules that template per-user-state (e.g. "${state} Annual Report"),
  // use "*" — the materializer substitutes data.state.
  jurisdiction_code: string;
  industry_slug: Industry | null;

  // The literal name that shows up on the deadline. Can contain "${state}"
  // which the materializer substitutes from onboarding data.
  name_template: string;
  description_template: string;
  deadline_type: string;
  // Same templating as name.
  agency_template: string;
  frequency: string;
  due_date_rule: DueDateRule;
  applies_when: AppliesWhen;
  severity_tier: SeverityTier;
  penalty_estimate_cents: number | null;
  source_url: string | null;
  statute_citation: string | null;
};

// ─── Evaluator ──────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function evaluateDueDate(rule: DueDateRule, referenceDate: Date): Date[] {
  const today = startOfDay(referenceDate);
  switch (rule.kind) {
    case "next_md": {
      const candidate = new Date(today.getFullYear(), rule.month, rule.day);
      if (candidate <= today) candidate.setFullYear(candidate.getFullYear() + 1);
      return [candidate];
    }
    case "next_year_md":
      return [new Date(today.getFullYear() + 1, rule.month, rule.day)];
    case "months_from_today": {
      const d = new Date(today);
      d.setMonth(d.getMonth() + rule.months);
      return [d];
    }
    case "years_from_today":
      return [new Date(today.getFullYear() + rule.years, today.getMonth(), today.getDate())];
    case "years_from_today_first_of_month":
      return [new Date(today.getFullYear() + rule.years, today.getMonth(), 1)];
    case "next_month_day": {
      const nextMonth = today.getMonth() + 1 > 11 ? 0 : today.getMonth() + 1;
      const candidate = new Date(today.getFullYear(), nextMonth, rule.day);
      if (candidate <= today) candidate.setFullYear(candidate.getFullYear() + 1);
      return [candidate];
    }
    case "quarterly_941": {
      // 941 quarter-end-month dates: Apr 30, Jul 31, Oct 31, Jan 31.
      // Returns the next `count` dates after today, iterating years as needed.
      // Matches the legacy `next941Dates(n, today)` helper exactly.
      const quarterEnds: Array<[number, number]> = [
        [3, 30],
        [6, 31],
        [9, 31],
        [0, 31],
      ];
      const out: Date[] = [];
      for (let year = today.getFullYear(); out.length < rule.count; year++) {
        for (const [m, d] of quarterEnds) {
          const dt = new Date(year, m, d);
          if (dt > today) out.push(dt);
          if (out.length >= rule.count) break;
        }
      }
      return out;
    }
  }
}

// ─── Applicability ──────────────────────────────────────────────────────────

export function ruleApplies(rule: RuleDef, data: OnboardingData): boolean {
  const w = rule.applies_when;
  if (w.state && data.state !== w.state) return false;
  if (w.state_in && !w.state_in.includes(data.state)) return false;
  if (w.state_not_in && w.state_not_in.includes(data.state)) return false;
  // state_any is informational; treated as match-all here.
  if (w.entity_in) {
    if (!data.entityType || !w.entity_in.includes(data.entityType)) return false;
  }
  if (w.industry && data.industry !== w.industry) return false;
  if (typeof w.hires_contractors === "boolean") {
    if ((data.hiresContractors ?? false) !== w.hires_contractors) return false;
  }
  if (typeof w.has_employees === "boolean") {
    const has = data.employeeRange !== null && data.employeeRange !== "1";
    if (has !== w.has_employees) return false;
  }
  if (typeof w.osha_required === "boolean") {
    if (requiresOshaLog(data.employeeRange) !== w.osha_required) return false;
  }
  return true;
}

export function getApplicableRules(
  data: OnboardingData,
  rules: RuleDef[] = LEGACY_RULES
): RuleDef[] {
  return rules.filter((r) => ruleApplies(r, data));
}

// ─── Materializer ───────────────────────────────────────────────────────────

export type DeadlineSeed = {
  business_id: string;
  name: string;
  description: string;
  deadline_type: string;
  governing_agency: string;
  frequency: string;
  due_date: string;
  source: string;
  severity_tier: SeverityTier;
  penalty_estimate_cents: number | null;
  source_url: string | null;
  statute_citation: string | null;
  rule_id: string;
  rule_version: number;
  occurrence_key: string;
};

function fillTemplate(template: string, data: OnboardingData): string {
  return template
    .replace(/\$\{state\}/g, data.state)
    .replace(/\$\{entityTypeUpper\}/g, data.entityType?.toUpperCase() ?? "");
}

function quarterOf(monthZeroIndexed: number): number {
  return Math.floor(monthZeroIndexed / 3) + 1;
}

function occurrenceKeyFor(frequency: string, dueDateIso: string): string {
  const [yearStr, monthStr] = dueDateIso.split("-");
  const year = yearStr ?? "0000";
  switch (frequency) {
    case "quarterly":
      return `${year}-Q${quarterOf(Number(monthStr ?? "1") - 1)}`;
    case "monthly":
      return `${year}-${monthStr ?? "01"}`;
    case "one_time":
    case "one-time":
      return "once";
    case "annual":
    case "biennial":
    case "triennial":
    case "decennial":
    default:
      return year;
  }
}

export function materializeRuleToDeadlines(
  rule: RuleDef,
  data: OnboardingData,
  businessId: string,
  referenceDate: Date
): DeadlineSeed[] {
  const dates = evaluateDueDate(rule.due_date_rule, referenceDate);
  return dates.map((dt) => {
    const due = formatIsoDate(dt);
    return {
      business_id: businessId,
      source: "discovery_agent",
      name: fillTemplate(rule.name_template, data),
      description: fillTemplate(rule.description_template, data),
      deadline_type: rule.deadline_type,
      governing_agency: fillTemplate(rule.agency_template, data),
      frequency: rule.frequency,
      due_date: due,
      severity_tier: rule.severity_tier,
      penalty_estimate_cents: rule.penalty_estimate_cents,
      source_url: rule.source_url,
      statute_citation: rule.statute_citation,
      rule_id: rule.rule_key,
      rule_version: rule.rule_version,
      occurrence_key: occurrenceKeyFor(rule.frequency, due),
    };
  });
}

// ─── Rule data — extracted verbatim from the prior buildStarterDeadlines ───
//
// Stable UUIDs are derived once (UUIDv4-like, fixed strings) so the SQL seed
// migration inserts the same row each time. The id pattern is decorative —
// what matters is uniqueness + stability across deploys.

// Generic 45-state fallback table (states without an explicit block).
// Each entry becomes 1 rule with jurisdiction_code=<state>, applies_when=
// {state: <state>, entity_in: [llc, s_corp, c_corp]}.
type StateFallback = {
  agency: string;
  month: number;
  day: number;
  frequency: "annual" | "biennial" | "decennial";
  source_url: string;
  statute_citation?: string;
  late_fee_cents?: number;
  uuid: string;
};

const STATE_FALLBACKS: Record<string, StateFallback> = {
  AL: { agency: "Alabama Secretary of State", month: 3, day: 15, frequency: "annual", source_url: "https://www.sos.alabama.gov/business-services", uuid: "10000000-0000-4000-8000-000000000001" },
  AK: { agency: "Alaska Division of Corporations", month: 0, day: 2, frequency: "biennial", source_url: "https://www.commerce.alaska.gov/web/cbpl/corporations.aspx", uuid: "10000000-0000-4000-8000-000000000002" },
  AZ: { agency: "Arizona Corporation Commission", month: 3, day: 15, frequency: "annual", source_url: "https://ecorp.azcc.gov/", uuid: "10000000-0000-4000-8000-000000000003" },
  AR: { agency: "Arkansas Secretary of State", month: 4, day: 1, frequency: "annual", source_url: "https://www.sos.arkansas.gov/business-commercial-services-bcs", late_fee_cents: 2500000, uuid: "10000000-0000-4000-8000-000000000004" },
  CO: { agency: "Colorado Secretary of State", month: 0, day: 31, frequency: "annual", source_url: "https://www.sos.state.co.us/biz/", uuid: "10000000-0000-4000-8000-000000000005" },
  CT: { agency: "Connecticut Secretary of State", month: 3, day: 1, frequency: "annual", source_url: "https://business.ct.gov/", uuid: "10000000-0000-4000-8000-000000000006" },
  DC: { agency: "DC Department of Licensing & Consumer Protection", month: 3, day: 1, frequency: "biennial", source_url: "https://dlcp.dc.gov/", uuid: "10000000-0000-4000-8000-000000000007" },
  GA: { agency: "Georgia Secretary of State", month: 3, day: 1, frequency: "annual", source_url: "https://sos.ga.gov/corporations-division", uuid: "10000000-0000-4000-8000-000000000008" },
  HI: { agency: "Hawaii Department of Commerce", month: 2, day: 31, frequency: "annual", source_url: "https://cca.hawaii.gov/breg/", uuid: "10000000-0000-4000-8000-000000000009" },
  ID: { agency: "Idaho Secretary of State", month: 10, day: 30, frequency: "annual", source_url: "https://sosbiz.idaho.gov/", uuid: "10000000-0000-4000-8000-00000000000a" },
  IL: { agency: "Illinois Secretary of State", month: 1, day: 1, frequency: "annual", source_url: "https://www.ilsos.gov/departments/business_services/home.html", late_fee_cents: 30000, uuid: "10000000-0000-4000-8000-00000000000b" },
  IN: { agency: "Indiana Secretary of State", month: 3, day: 30, frequency: "biennial", source_url: "https://inbiz.in.gov/", uuid: "10000000-0000-4000-8000-00000000000c" },
  IA: { agency: "Iowa Secretary of State", month: 3, day: 1, frequency: "biennial", source_url: "https://sos.iowa.gov/business/", uuid: "10000000-0000-4000-8000-00000000000d" },
  KS: { agency: "Kansas Secretary of State", month: 3, day: 15, frequency: "annual", source_url: "https://sos.ks.gov/business/business-filing-center.html", uuid: "10000000-0000-4000-8000-00000000000e" },
  KY: { agency: "Kentucky Secretary of State", month: 5, day: 30, frequency: "annual", source_url: "https://sos.ky.gov/bus/", uuid: "10000000-0000-4000-8000-00000000000f" },
  LA: { agency: "Louisiana Secretary of State", month: 3, day: 15, frequency: "annual", source_url: "https://www.sos.la.gov/BusinessServices/", uuid: "10000000-0000-4000-8000-000000000010" },
  ME: { agency: "Maine Secretary of State", month: 5, day: 1, frequency: "annual", source_url: "https://www.maine.gov/sos/cec/corp/", uuid: "10000000-0000-4000-8000-000000000011" },
  MD: { agency: "Maryland State Department of Assessments", month: 3, day: 15, frequency: "annual", source_url: "https://dat.maryland.gov/", uuid: "10000000-0000-4000-8000-000000000012" },
  MA: { agency: "Massachusetts Secretary of the Commonwealth", month: 2, day: 15, frequency: "annual", source_url: "https://www.sec.state.ma.us/cor/", uuid: "10000000-0000-4000-8000-000000000013" },
  MI: { agency: "Michigan LARA Bureau of Corporations", month: 1, day: 15, frequency: "annual", source_url: "https://www.michigan.gov/lara/bureau-list/cscl", uuid: "10000000-0000-4000-8000-000000000014" },
  MN: { agency: "Minnesota Secretary of State", month: 11, day: 31, frequency: "annual", source_url: "https://www.sos.state.mn.us/business-liens/", uuid: "10000000-0000-4000-8000-000000000015" },
  MS: { agency: "Mississippi Secretary of State", month: 3, day: 15, frequency: "annual", source_url: "https://www.sos.ms.gov/business-services", uuid: "10000000-0000-4000-8000-000000000016" },
  MO: { agency: "Missouri Secretary of State", month: 7, day: 30, frequency: "annual", source_url: "https://www.sos.mo.gov/business", uuid: "10000000-0000-4000-8000-000000000017" },
  MT: { agency: "Montana Secretary of State", month: 3, day: 15, frequency: "annual", source_url: "https://sosmt.gov/business/", uuid: "10000000-0000-4000-8000-000000000018" },
  NE: { agency: "Nebraska Secretary of State", month: 3, day: 1, frequency: "biennial", source_url: "https://sos.nebraska.gov/business-services", uuid: "10000000-0000-4000-8000-000000000019" },
  NV: { agency: "Nevada Secretary of State", month: 0, day: 31, frequency: "annual", source_url: "https://www.nvsos.gov/sos/businesses/", uuid: "10000000-0000-4000-8000-00000000001a" },
  NH: { agency: "New Hampshire Secretary of State", month: 3, day: 1, frequency: "annual", source_url: "https://quickstart.sos.nh.gov/", uuid: "10000000-0000-4000-8000-00000000001b" },
  NJ: { agency: "New Jersey Division of Revenue", month: 3, day: 30, frequency: "annual", source_url: "https://www.nj.gov/treasury/revenue/", uuid: "10000000-0000-4000-8000-00000000001c" },
  NM: { agency: "New Mexico Secretary of State", month: 3, day: 15, frequency: "biennial", source_url: "https://www.sos.state.nm.us/business-services/", uuid: "10000000-0000-4000-8000-00000000001d" },
  NC: { agency: "North Carolina Secretary of State", month: 3, day: 15, frequency: "annual", source_url: "https://www.sosnc.gov/divisions/business_registration", uuid: "10000000-0000-4000-8000-00000000001e" },
  ND: { agency: "North Dakota Secretary of State", month: 10, day: 1, frequency: "annual", source_url: "https://sos.nd.gov/business/", uuid: "10000000-0000-4000-8000-00000000001f" },
  OH: { agency: "Ohio Secretary of State", month: 3, day: 15, frequency: "annual", source_url: "https://www.ohiosos.gov/businesses/", uuid: "10000000-0000-4000-8000-000000000020" },
  OK: { agency: "Oklahoma Secretary of State", month: 5, day: 30, frequency: "annual", source_url: "https://www.sos.ok.gov/business/", uuid: "10000000-0000-4000-8000-000000000021" },
  OR: { agency: "Oregon Secretary of State", month: 11, day: 31, frequency: "annual", source_url: "https://sos.oregon.gov/business/", uuid: "10000000-0000-4000-8000-000000000022" },
  PA: { agency: "Pennsylvania Department of State", month: 5, day: 30, frequency: "decennial", source_url: "https://www.dos.pa.gov/BusinessCharities/", uuid: "10000000-0000-4000-8000-000000000023" },
  RI: { agency: "Rhode Island Department of State", month: 1, day: 1, frequency: "annual", source_url: "https://www.sos.ri.gov/divisions/business-services", uuid: "10000000-0000-4000-8000-000000000024" },
  SC: { agency: "South Carolina Secretary of State", month: 2, day: 15, frequency: "annual", source_url: "https://sos.sc.gov/online-filings", uuid: "10000000-0000-4000-8000-000000000025" },
  SD: { agency: "South Dakota Secretary of State", month: 0, day: 31, frequency: "annual", source_url: "https://sosenterprise.sd.gov/", uuid: "10000000-0000-4000-8000-000000000026" },
  TN: { agency: "Tennessee Secretary of State", month: 3, day: 1, frequency: "annual", source_url: "https://sos.tn.gov/business-services", uuid: "10000000-0000-4000-8000-000000000027" },
  UT: { agency: "Utah Division of Corporations", month: 3, day: 15, frequency: "annual", source_url: "https://corporations.utah.gov/", uuid: "10000000-0000-4000-8000-000000000028" },
  VT: { agency: "Vermont Secretary of State", month: 2, day: 15, frequency: "annual", source_url: "https://sos.vermont.gov/corporations/", uuid: "10000000-0000-4000-8000-000000000029" },
  VA: { agency: "Virginia State Corporation Commission", month: 11, day: 31, frequency: "annual", source_url: "https://www.scc.virginia.gov/clk/", uuid: "10000000-0000-4000-8000-00000000002a" },
  WA: { agency: "Washington Secretary of State", month: 3, day: 30, frequency: "annual", source_url: "https://www.sos.wa.gov/corporations/", uuid: "10000000-0000-4000-8000-00000000002b" },
  WV: { agency: "West Virginia Secretary of State", month: 5, day: 30, frequency: "annual", source_url: "https://sos.wv.gov/business/Pages/default.aspx", uuid: "10000000-0000-4000-8000-00000000002c" },
  WI: { agency: "Wisconsin Department of Financial Institutions", month: 3, day: 1, frequency: "annual", source_url: "https://www.wdfi.org/corporations/", uuid: "10000000-0000-4000-8000-00000000002d" },
  WY: { agency: "Wyoming Secretary of State", month: 0, day: 1, frequency: "annual", source_url: "https://wyobiz.wyo.gov/", uuid: "10000000-0000-4000-8000-00000000002e" },
};

const EXPLICITLY_HANDLED_STATES = ["CA", "TX", "NY", "DE", "FL"];

// State-fallback rules. One per non-explicitly-handled state. Each fires
// only for LLC/S/C corps in that state.
const STATE_FALLBACK_RULES: RuleDef[] = Object.entries(STATE_FALLBACKS).map(
  ([stateCode, sf]) => ({
    id: sf.uuid,
    rule_key: `state-fallback-${stateCode.toLowerCase()}`,
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: stateCode,
    industry_slug: null,
    name_template: `${stateCode} ${
      sf.frequency === "biennial"
        ? "Biennial"
        : sf.frequency === "decennial"
          ? "Decennial"
          : "Annual"
    } Entity Report`,
    description_template: `${
      sf.frequency === "decennial"
        ? "Decennial"
        : sf.frequency === "biennial"
          ? "Biennial"
          : "Annual"
    } entity report filed with the ${sf.agency}. Failure to file can result in administrative dissolution. Verify filing window and fee at the agency portal.`,
    deadline_type: "entity_filing",
    agency_template: sf.agency,
    frequency: sf.frequency,
    due_date_rule: { kind: "next_md", month: sf.month, day: sf.day },
    applies_when: {
      state: stateCode,
      entity_in: ["llc", "s_corp", "c_corp"],
    },
    severity_tier: "high",
    penalty_estimate_cents: sf.late_fee_cents ?? 10000,
    source_url: sf.source_url,
    statute_citation: sf.statute_citation ?? null,
  })
);

// All other rules — federal, explicitly-handled-state, industry, and the
// universal "${state} Annual Report / Entity Filing" template.
const CORE_RULES: RuleDef[] = [
  // ── Universal: generic ${state} Annual Report (fires for ALL states + LLC/S/C) ──
  {
    id: "20000000-0000-4000-8000-000000000001",
    rule_key: "universal-state-annual-entity-filing",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: null,
    name_template: "${state} Annual Report / Entity Filing",
    description_template:
      "Annual state entity report for ${entityTypeUpper} in ${state}. Failure to file can result in administrative dissolution.",
    deadline_type: "entity_filing",
    agency_template: "${state} Secretary of State",
    frequency: "annual",
    due_date_rule: { kind: "years_from_today", years: 1 },
    applies_when: {
      state_any: true,
      entity_in: ["llc", "s_corp", "c_corp"],
    },
    severity_tier: "high",
    penalty_estimate_cents: 10000,
    // The original code looked up STATE_RULES[state]?.source_url for this,
    // which returns undefined for the explicitly-handled 5 states. We pass
    // null here; explicit state rules carry their own citations.
    source_url: null,
    statute_citation: null,
  },

  // ── Universal: Business License Renewal (every business, today + 11mo) ──
  {
    id: "20000000-0000-4000-8000-000000000002",
    rule_key: "universal-business-license-renewal",
    rule_version: 1,
    jurisdiction_type: "local",
    jurisdiction_code: "*",
    industry_slug: null,
    name_template: "Business License Renewal",
    description_template:
      "City/county general business operating license renewal. Verify exact due date with your local licensing office.",
    deadline_type: "business_license",
    agency_template: "City / County Business Office",
    frequency: "annual",
    due_date_rule: { kind: "months_from_today", months: 11 },
    applies_when: {},
    severity_tier: "medium",
    penalty_estimate_cents: 5000,
    source_url: null,
    statute_citation: null,
  },

  // ── Federal: S-Corp / Partnership return ──
  {
    id: "20000000-0000-4000-8000-000000000010",
    rule_key: "federal-1120s-1065-return",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: null,
    name_template: "Federal Business Tax Return (Form 1120-S / 1065)",
    description_template:
      "S-Corp and partnership federal income tax return due March 15. File Form 7004 for a 6-month extension.",
    deadline_type: "tax_filing",
    agency_template: "IRS",
    frequency: "annual",
    due_date_rule: { kind: "next_md", month: 2, day: 15 },
    applies_when: { entity_in: ["s_corp", "partnership"] },
    severity_tier: "critical",
    penalty_estimate_cents: 21000,
    source_url: "https://www.irs.gov/businesses/small-businesses-self-employed/s-corporations",
    statute_citation: "IRC §6699",
  },

  // ── Federal: C-Corp 1120 ──
  {
    id: "20000000-0000-4000-8000-000000000011",
    rule_key: "federal-1120-ccorp-return",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: null,
    name_template: "Federal Corporate Tax Return (Form 1120)",
    description_template:
      "C-Corp federal income tax return due April 15. File Form 7004 for a 6-month extension.",
    deadline_type: "tax_filing",
    agency_template: "IRS",
    frequency: "annual",
    due_date_rule: { kind: "next_md", month: 3, day: 15 },
    applies_when: { entity_in: ["c_corp"] },
    severity_tier: "critical",
    penalty_estimate_cents: 50000,
    source_url: "https://www.irs.gov/forms-pubs/about-form-1120",
    statute_citation: "IRC §6651",
  },

  // ── Federal: 1040 Schedule C for everyone else ──
  // The legacy code uses an else-branch on entity_type, so this fires when
  // entity_type ∉ {s_corp, partnership, c_corp} — meaning: llc, sole_proprietor,
  // nonprofit, or null. Modelled here as the explicit complementary set.
  {
    id: "20000000-0000-4000-8000-000000000012",
    rule_key: "federal-1040-schedule-c",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: null,
    name_template: "Federal Income Tax Return (Schedule C / 1040)",
    description_template:
      "Individual federal income tax return including business income. Due April 15.",
    deadline_type: "tax_filing",
    agency_template: "IRS",
    frequency: "annual",
    due_date_rule: { kind: "next_md", month: 3, day: 15 },
    applies_when: { entity_in: ["llc", "sole_proprietor", "nonprofit"] },
    severity_tier: "high",
    penalty_estimate_cents: 50000,
    source_url: "https://www.irs.gov/forms-pubs/about-form-1040",
    statute_citation: "IRC §6651",
  },

  // ── Federal: Quarterly Estimated Taxes (4 separate rules: Q1-Q4) ──
  // Applies to all entity_types EXCEPT c_corp. Legacy code also has a
  // filter `if (dt <= nextYear)` — equivalent to "due within 366 days
  // of today." Given the four canonical dates always land within a year
  // of any reference date in the same calendar year, we model the filter
  // as implicit: the date evaluator returns the next occurrence which is
  // always within ~1 year, satisfying the filter. (Verified manually for
  // the snapshot test's REF=Jan 15 2026 — all 4 occurrences fall before
  // Jan 15 2027.)
  {
    id: "20000000-0000-4000-8000-000000000013",
    rule_key: "federal-estimated-tax-q1",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: null,
    name_template: "Federal Estimated Tax Payment — Q1",
    description_template:
      "IRS quarterly estimated tax payment (Form 1040-ES). Required if you expect to owe $1,000+ in taxes. Q1 payment due.",
    deadline_type: "tax_filing",
    agency_template: "IRS",
    frequency: "quarterly",
    due_date_rule: { kind: "next_md", month: 3, day: 15 },
    applies_when: {
      entity_in: ["llc", "s_corp", "sole_proprietor", "partnership", "nonprofit"],
    },
    severity_tier: "high",
    penalty_estimate_cents: 15000,
    source_url: "https://www.irs.gov/forms-pubs/about-form-1040-es",
    statute_citation: "IRC §6654",
  },
  {
    id: "20000000-0000-4000-8000-000000000014",
    rule_key: "federal-estimated-tax-q2",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: null,
    name_template: "Federal Estimated Tax Payment — Q2",
    description_template:
      "IRS quarterly estimated tax payment (Form 1040-ES). Required if you expect to owe $1,000+ in taxes. Q2 payment due.",
    deadline_type: "tax_filing",
    agency_template: "IRS",
    frequency: "quarterly",
    due_date_rule: { kind: "next_md", month: 5, day: 17 },
    applies_when: {
      entity_in: ["llc", "s_corp", "sole_proprietor", "partnership", "nonprofit"],
    },
    severity_tier: "high",
    penalty_estimate_cents: 15000,
    source_url: "https://www.irs.gov/forms-pubs/about-form-1040-es",
    statute_citation: "IRC §6654",
  },
  {
    id: "20000000-0000-4000-8000-000000000015",
    rule_key: "federal-estimated-tax-q3",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: null,
    name_template: "Federal Estimated Tax Payment — Q3",
    description_template:
      "IRS quarterly estimated tax payment (Form 1040-ES). Required if you expect to owe $1,000+ in taxes. Q3 payment due.",
    deadline_type: "tax_filing",
    agency_template: "IRS",
    frequency: "quarterly",
    due_date_rule: { kind: "next_md", month: 8, day: 16 },
    applies_when: {
      entity_in: ["llc", "s_corp", "sole_proprietor", "partnership", "nonprofit"],
    },
    severity_tier: "high",
    penalty_estimate_cents: 15000,
    source_url: "https://www.irs.gov/forms-pubs/about-form-1040-es",
    statute_citation: "IRC §6654",
  },
  {
    id: "20000000-0000-4000-8000-000000000016",
    rule_key: "federal-estimated-tax-q4",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: null,
    name_template: "Federal Estimated Tax Payment — Q4",
    description_template:
      "IRS quarterly estimated tax payment (Form 1040-ES). Required if you expect to owe $1,000+ in taxes. Q4 payment due.",
    deadline_type: "tax_filing",
    agency_template: "IRS",
    frequency: "quarterly",
    due_date_rule: { kind: "next_md", month: 0, day: 15 },
    applies_when: {
      entity_in: ["llc", "s_corp", "sole_proprietor", "partnership", "nonprofit"],
    },
    severity_tier: "high",
    penalty_estimate_cents: 15000,
    source_url: "https://www.irs.gov/forms-pubs/about-form-1040-es",
    statute_citation: "IRC §6654",
  },

  // ── Federal payroll: 941 (employer with employees) — emits next 2 dates ──
  {
    id: "20000000-0000-4000-8000-000000000020",
    rule_key: "federal-941-quarterly-payroll",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: null,
    name_template: "Quarterly Payroll Tax Filing (Form 941)",
    description_template:
      "IRS Form 941 — quarterly payroll tax return reporting employee wages, tips, and federal withholding. Late filing penalty: 5% per month.",
    deadline_type: "tax_filing",
    agency_template: "IRS",
    frequency: "quarterly",
    due_date_rule: { kind: "quarterly_941", count: 2 },
    applies_when: { has_employees: true },
    severity_tier: "critical",
    penalty_estimate_cents: 200000,
    source_url: "https://www.irs.gov/forms-pubs/about-form-941",
    statute_citation: "IRC §6651, §6656 (failure-to-deposit)",
  },

  // ── Federal payroll: 940 FUTA annual ──
  {
    id: "20000000-0000-4000-8000-000000000021",
    rule_key: "federal-940-futa-annual",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: null,
    name_template: "Annual FUTA Tax Return (Form 940)",
    description_template:
      "IRS Form 940 — annual Federal Unemployment Tax Act return. Due January 31. Deposit may be required quarterly if FUTA liability exceeds $500.",
    deadline_type: "tax_filing",
    agency_template: "IRS",
    frequency: "annual",
    due_date_rule: { kind: "next_md", month: 0, day: 31 },
    applies_when: { has_employees: true },
    severity_tier: "high",
    penalty_estimate_cents: 50000,
    source_url: "https://www.irs.gov/forms-pubs/about-form-940",
    statute_citation: "IRC §3301",
  },

  // ── Federal: W-2 / 1099 (employer) ──
  {
    id: "20000000-0000-4000-8000-000000000022",
    rule_key: "federal-w2-1099-filing",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: null,
    name_template: "W-2 / 1099 Filing Deadline",
    description_template:
      "File W-2s with SSA and distribute to employees by January 31. File 1099-NEC forms for contractors paid $600+.",
    deadline_type: "tax_filing",
    agency_template: "IRS / SSA",
    frequency: "annual",
    due_date_rule: { kind: "next_md", month: 0, day: 31 },
    applies_when: { has_employees: true },
    severity_tier: "high",
    penalty_estimate_cents: 6000,
    source_url: "https://www.irs.gov/forms-pubs/about-form-w-2",
    statute_citation: "IRC §6721",
  },

  // ── State: Workers' Comp Renewal (employer) ──
  {
    id: "20000000-0000-4000-8000-000000000023",
    rule_key: "state-workers-comp-renewal",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: null,
    name_template: "Workers' Compensation Insurance Renewal",
    description_template:
      "Annual workers' comp policy renewal. Required by law in most states for businesses with employees. Verify your policy expiry date.",
    deadline_type: "business_license",
    agency_template: "${state} Workers' Comp Board",
    frequency: "annual",
    due_date_rule: { kind: "months_from_today", months: 10 },
    applies_when: { has_employees: true },
    severity_tier: "critical",
    penalty_estimate_cents: 500000,
    source_url: null,
    statute_citation: null,
  },

  // ── Federal: OSHA 300 Log (>= OSHA threshold employees) ──
  {
    id: "20000000-0000-4000-8000-000000000024",
    rule_key: "federal-osha-300-log-annual",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: null,
    name_template: "OSHA 300 Log — Annual Summary Posting",
    description_template:
      "Post the OSHA 300A annual summary of work-related injuries and illnesses from Feb 1 – Apr 30.",
    deadline_type: "equipment_inspection",
    agency_template: "OSHA (Federal / State)",
    frequency: "annual",
    due_date_rule: { kind: "next_year_md", month: 1, day: 1 },
    applies_when: { osha_required: true },
    severity_tier: "medium",
    penalty_estimate_cents: 1500000,
    source_url: "https://www.osha.gov/recordkeeping",
    statute_citation: "29 CFR 1904",
  },

  // ── Federal: 1099-NEC for contractor-hiring businesses ──
  {
    id: "20000000-0000-4000-8000-000000000025",
    rule_key: "federal-1099-nec-contractors",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: null,
    name_template: "1099-NEC Filing for Contractors",
    description_template:
      "File 1099-NEC forms with the IRS and send copies to all contractors paid $600+ during the year. Due January 31.",
    deadline_type: "tax_filing",
    agency_template: "IRS",
    frequency: "annual",
    due_date_rule: { kind: "next_md", month: 0, day: 31 },
    applies_when: { hires_contractors: true },
    severity_tier: "high",
    penalty_estimate_cents: 6000,
    source_url: "https://www.irs.gov/forms-pubs/about-form-1099-nec",
    statute_citation: "IRC §6041A",
  },

  // ── CA-specific ──
  {
    id: "20000000-0000-4000-8000-000000000030",
    rule_key: "state-ca-min-franchise-tax-800",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "CA",
    industry_slug: null,
    name_template: "California Minimum Franchise Tax ($800)",
    description_template:
      "California imposes an $800 annual minimum franchise tax on all LLCs, S-Corps, and C-Corps registered in the state, regardless of income or activity. Due April 15 for calendar-year entities (Form 3522).",
    deadline_type: "tax_filing",
    agency_template: "California Franchise Tax Board (FTB)",
    frequency: "annual",
    due_date_rule: { kind: "next_md", month: 3, day: 15 },
    applies_when: { state: "CA", entity_in: ["llc", "s_corp", "c_corp"] },
    severity_tier: "critical",
    penalty_estimate_cents: 80000,
    source_url: "https://www.ftb.ca.gov/file/business/types/limited-liability-company/index.html",
    statute_citation: "CA Rev & Tax Code §17941",
  },
  {
    id: "20000000-0000-4000-8000-000000000031",
    rule_key: "state-ca-llc-statement-of-information",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "CA",
    industry_slug: null,
    name_template: "CA LLC Statement of Information",
    description_template:
      "California LLCs must file a Statement of Information with the Secretary of State annually within 90 days of formation, then every two years. $20 filing fee.",
    deadline_type: "entity_filing",
    agency_template: "California Secretary of State",
    frequency: "biennial",
    due_date_rule: { kind: "next_md", month: 3, day: 15 },
    applies_when: { state: "CA", entity_in: ["llc"] },
    severity_tier: "high",
    penalty_estimate_cents: 25000,
    source_url: "https://bizfileonline.sos.ca.gov/",
    statute_citation: "CA Corp Code §17702.09",
  },
  {
    id: "20000000-0000-4000-8000-000000000032",
    rule_key: "state-ca-sdi-payroll-registration",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "CA",
    industry_slug: null,
    name_template: "California SDI / Payroll Tax Registration",
    description_template:
      "California employers must register with the EDD for State Disability Insurance (SDI) and Unemployment Insurance (UI). Quarterly DE 9 / DE 9C payroll tax returns are due.",
    deadline_type: "tax_filing",
    agency_template: "California EDD",
    frequency: "quarterly",
    due_date_rule: { kind: "next_md", month: 3, day: 30 },
    applies_when: { state: "CA", has_employees: true },
    severity_tier: "high",
    penalty_estimate_cents: 50000,
    source_url: "https://edd.ca.gov/Payroll_Taxes/",
    statute_citation: "CA Unemployment Insurance Code §1112",
  },

  // ── TX-specific ──
  {
    id: "20000000-0000-4000-8000-000000000040",
    rule_key: "state-tx-franchise-tax-report",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "TX",
    industry_slug: null,
    name_template: "Texas Franchise Tax Report",
    description_template:
      "Texas imposes a franchise (margin) tax on LLCs, corporations, and partnerships. Annual Public Information Report and tax return due May 15. No-tax-due threshold applies for small businesses under ~$2.47M revenue.",
    deadline_type: "tax_filing",
    agency_template: "Texas Comptroller of Public Accounts",
    frequency: "annual",
    due_date_rule: { kind: "next_md", month: 4, day: 15 },
    applies_when: { state: "TX", entity_in: ["llc", "s_corp", "c_corp", "partnership"] },
    severity_tier: "high",
    penalty_estimate_cents: 5000,
    source_url: "https://comptroller.texas.gov/taxes/franchise/",
    statute_citation: "TX Tax Code Ch. 171",
  },

  // ── NY-specific ──
  {
    id: "20000000-0000-4000-8000-000000000050",
    rule_key: "state-ny-llc-biennial-statement",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "NY",
    industry_slug: null,
    name_template: "New York LLC Biennial Statement",
    description_template:
      "New York LLCs must file a Biennial Statement with the Department of State every two years by the end of the anniversary month of formation. $9 fee online.",
    deadline_type: "entity_filing",
    agency_template: "New York Department of State",
    frequency: "biennial",
    due_date_rule: { kind: "years_from_today_first_of_month", years: 2 },
    applies_when: { state: "NY", entity_in: ["llc"] },
    severity_tier: "medium",
    penalty_estimate_cents: 25000,
    source_url: "https://dos.ny.gov/biennial-statements",
    statute_citation: "NY LLC Law §301",
  },
  {
    id: "20000000-0000-4000-8000-000000000051",
    rule_key: "state-ny-corp-biennial-statement",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "NY",
    industry_slug: null,
    name_template: "New York Corporation Biennial Statement",
    description_template:
      "NY domestic and foreign corporations must file a biennial statement with the Department of State. Due by January 31 of the applicable year.",
    deadline_type: "entity_filing",
    agency_template: "New York Department of State",
    frequency: "biennial",
    due_date_rule: { kind: "next_md", month: 0, day: 31 },
    applies_when: { state: "NY", entity_in: ["s_corp", "c_corp"] },
    severity_tier: "medium",
    penalty_estimate_cents: 25000,
    source_url: "https://dos.ny.gov/biennial-statements",
    statute_citation: "NY BCL §408",
  },

  // ── DE-specific ──
  {
    id: "20000000-0000-4000-8000-000000000060",
    rule_key: "state-de-llc-annual-tax-300",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "DE",
    industry_slug: null,
    name_template: "Delaware LLC Annual Tax",
    description_template:
      "All Delaware LLCs must pay a $300 annual tax by June 1, regardless of activity or income. Failure to pay results in void status and $200 penalty.",
    deadline_type: "tax_filing",
    agency_template: "Delaware Division of Corporations",
    frequency: "annual",
    due_date_rule: { kind: "next_md", month: 5, day: 1 },
    applies_when: { state: "DE", entity_in: ["llc"] },
    severity_tier: "critical",
    penalty_estimate_cents: 20000,
    source_url: "https://corp.delaware.gov/paytaxes/",
    statute_citation: "8 DE Code §132",
  },
  {
    id: "20000000-0000-4000-8000-000000000061",
    rule_key: "state-de-franchise-tax-annual-report",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "DE",
    industry_slug: null,
    name_template: "Delaware Franchise Tax (Annual Report)",
    description_template:
      "Delaware corporations must file an annual report and pay franchise tax by March 1. Minimum $50 (Authorized Shares method) or potentially thousands under Assumed Par Value Capital method. All registered agents notify due December–February.",
    deadline_type: "tax_filing",
    agency_template: "Delaware Division of Corporations",
    frequency: "annual",
    due_date_rule: { kind: "next_md", month: 2, day: 1 },
    applies_when: { state: "DE", entity_in: ["c_corp", "s_corp"] },
    severity_tier: "critical",
    penalty_estimate_cents: 20000,
    source_url: "https://corp.delaware.gov/paytaxes/",
    statute_citation: "8 DE Code §503",
  },

  // ── FL-specific ──
  {
    id: "20000000-0000-4000-8000-000000000070",
    rule_key: "state-fl-annual-report",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "FL",
    industry_slug: null,
    name_template: "Florida Annual Report",
    description_template:
      "All Florida business entities must file an annual report with the Division of Corporations by May 1. $138.75 for LLCs, $150 for corporations. Late fee: $400.",
    deadline_type: "entity_filing",
    agency_template: "Florida Division of Corporations (Sunbiz)",
    frequency: "annual",
    due_date_rule: { kind: "next_md", month: 4, day: 1 },
    applies_when: { state: "FL", entity_in: ["llc", "s_corp", "c_corp"] },
    severity_tier: "high",
    penalty_estimate_cents: 40000,
    source_url: "https://dos.fl.gov/sunbiz/",
    statute_citation: "Fla. Stat. §605.0212",
  },

  // ── Industry: Restaurant ──
  {
    id: "20000000-0000-4000-8000-000000000080",
    rule_key: "industry-restaurant-health-permit",
    rule_version: 1,
    jurisdiction_type: "local",
    jurisdiction_code: "*",
    industry_slug: "restaurant",
    name_template: "Food Service / Health Permit Renewal",
    description_template:
      "Annual food service establishment permit required by your local health department.",
    deadline_type: "business_license",
    agency_template: "County Health Department",
    frequency: "annual",
    due_date_rule: { kind: "months_from_today", months: 6 },
    applies_when: { industry: "restaurant" },
    severity_tier: "critical",
    penalty_estimate_cents: 100000,
    source_url: null,
    statute_citation: null,
  },
  {
    id: "20000000-0000-4000-8000-000000000081",
    rule_key: "industry-restaurant-food-handler-cert",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: "restaurant",
    name_template: "Food Handler Certifications (Staff)",
    description_template:
      "Track expiry for all food handler cards / ServSafe certifications for front-of-house and kitchen staff.",
    deadline_type: "employee_cert",
    agency_template: "State Health Department",
    frequency: "biennial",
    due_date_rule: { kind: "years_from_today", years: 1 },
    applies_when: { industry: "restaurant" },
    severity_tier: "high",
    penalty_estimate_cents: 25000,
    source_url: "https://www.servsafe.com/",
    statute_citation: null,
  },
  {
    id: "20000000-0000-4000-8000-000000000082",
    rule_key: "industry-restaurant-sales-tax-monthly",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: "restaurant",
    name_template: "State Sales Tax Filing — Monthly",
    description_template:
      "Monthly state sales tax return for food/beverage sales. Verify filing frequency with your state revenue department.",
    deadline_type: "tax_filing",
    agency_template: "${state} Department of Revenue",
    frequency: "monthly",
    due_date_rule: { kind: "next_month_day", day: 20 },
    applies_when: { industry: "restaurant" },
    severity_tier: "high",
    penalty_estimate_cents: 20000,
    source_url: null,
    statute_citation: null,
  },

  // ── Industry: Construction ──
  {
    id: "20000000-0000-4000-8000-000000000090",
    rule_key: "industry-construction-contractor-license",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: "construction",
    name_template: "Contractor License Renewal",
    description_template:
      "State contractor license renewal. Required to legally bid and perform work.",
    deadline_type: "business_license",
    agency_template: "${state} Contractors Licensing Board",
    frequency: "biennial",
    due_date_rule: { kind: "years_from_today", years: 1 },
    applies_when: { industry: "construction" },
    severity_tier: "critical",
    penalty_estimate_cents: 500000,
    source_url: null,
    statute_citation: null,
  },
  {
    id: "20000000-0000-4000-8000-000000000091",
    rule_key: "industry-construction-subcontractor-coi",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: "construction",
    name_template: "Subcontractor COI Renewals",
    description_template:
      "Certificate of Insurance renewals for all active subcontractors. Expired COIs expose you to liability.",
    deadline_type: "coi",
    agency_template: "Insurance Provider",
    frequency: "annual",
    due_date_rule: { kind: "years_from_today", years: 1 },
    applies_when: { industry: "construction", hires_contractors: true },
    severity_tier: "high",
    penalty_estimate_cents: 250000,
    source_url: null,
    statute_citation: null,
  },

  // ── Industry: Healthcare ──
  {
    id: "20000000-0000-4000-8000-0000000000a0",
    rule_key: "industry-healthcare-professional-license",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: "healthcare",
    name_template: "Professional License Renewals",
    description_template:
      "Track all staff professional license renewals (RN, MD, PT, etc.) and continuing education requirements.",
    deadline_type: "employee_cert",
    agency_template: "${state} Professional Licensing Board",
    frequency: "biennial",
    due_date_rule: { kind: "years_from_today", years: 1 },
    applies_when: { industry: "healthcare" },
    severity_tier: "critical",
    penalty_estimate_cents: 1000000,
    source_url: null,
    statute_citation: null,
  },
  {
    id: "20000000-0000-4000-8000-0000000000a1",
    rule_key: "industry-healthcare-dea-registration",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: "healthcare",
    name_template: "DEA Registration Renewal",
    description_template:
      "DEA practitioner registration renewal required for any provider authorized to prescribe controlled substances. Typically triennial.",
    deadline_type: "business_license",
    agency_template: "DEA",
    frequency: "triennial",
    due_date_rule: { kind: "years_from_today", years: 3 },
    applies_when: { industry: "healthcare" },
    severity_tier: "critical",
    penalty_estimate_cents: 1000000,
    source_url: "https://www.deadiversion.usdoj.gov/drugreg/",
    statute_citation: "21 USC §822",
  },
  {
    id: "20000000-0000-4000-8000-0000000000a2",
    rule_key: "industry-healthcare-hipaa-risk-assessment",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: "healthcare",
    name_template: "HIPAA Security Risk Assessment",
    description_template:
      "Annual HIPAA Security Rule risk analysis required for all covered entities and business associates. Document findings and remediation plan.",
    deadline_type: "equipment_inspection",
    agency_template: "HHS / OCR",
    frequency: "annual",
    due_date_rule: { kind: "years_from_today", years: 1 },
    applies_when: { industry: "healthcare" },
    severity_tier: "high",
    penalty_estimate_cents: 10000000,
    source_url: "https://www.hhs.gov/hipaa/for-professionals/security/",
    statute_citation: "45 CFR 164.308(a)(1)",
  },

  // ── Industry: Retail ──
  {
    id: "20000000-0000-4000-8000-0000000000b0",
    rule_key: "industry-retail-sales-tax-monthly",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: "retail",
    name_template: "State Sales Tax Filing",
    description_template:
      "Monthly or quarterly state sales tax return. Verify your filing frequency — high-volume retailers file monthly.",
    deadline_type: "tax_filing",
    agency_template: "${state} Department of Revenue",
    frequency: "monthly",
    due_date_rule: { kind: "next_month_day", day: 20 },
    applies_when: { industry: "retail" },
    severity_tier: "high",
    penalty_estimate_cents: 20000,
    source_url: null,
    statute_citation: null,
  },
  {
    id: "20000000-0000-4000-8000-0000000000b1",
    rule_key: "industry-retail-sellers-permit",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: "retail",
    name_template: "Seller's Permit / Retail License Renewal",
    description_template:
      "State retail seller's permit renewal. Required to collect and remit sales tax. Verify renewal period with your state.",
    deadline_type: "business_license",
    agency_template: "${state} Department of Revenue",
    frequency: "annual",
    due_date_rule: { kind: "years_from_today", years: 1 },
    applies_when: { industry: "retail" },
    severity_tier: "high",
    penalty_estimate_cents: 50000,
    source_url: null,
    statute_citation: null,
  },

  // ── Industry: Personal Services ──
  {
    id: "20000000-0000-4000-8000-0000000000c0",
    rule_key: "industry-personal-services-cosmetology-license",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: "personal_services",
    name_template: "Cosmetology / Trade License Renewal",
    description_template:
      "State professional board license renewal for barbers, cosmetologists, estheticians, and nail technicians. Required for all licensed staff.",
    deadline_type: "employee_cert",
    agency_template: "${state} Board of Cosmetology",
    frequency: "biennial",
    due_date_rule: { kind: "years_from_today", years: 1 },
    applies_when: { industry: "personal_services" },
    severity_tier: "high",
    penalty_estimate_cents: 50000,
    source_url: null,
    statute_citation: null,
  },
  {
    id: "20000000-0000-4000-8000-0000000000c1",
    rule_key: "industry-personal-services-establishment-license",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: "personal_services",
    name_template: "Establishment License Renewal",
    description_template:
      "State facility license for salon, spa, or personal service establishment. Separate from individual staff licenses.",
    deadline_type: "business_license",
    agency_template: "${state} Board of Cosmetology / Health",
    frequency: "annual",
    due_date_rule: { kind: "years_from_today", years: 1 },
    applies_when: { industry: "personal_services" },
    severity_tier: "high",
    penalty_estimate_cents: 50000,
    source_url: null,
    statute_citation: null,
  },

  // ── Industry: Fitness ──
  {
    id: "20000000-0000-4000-8000-0000000000d0",
    rule_key: "industry-fitness-facility-license",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: "fitness",
    name_template: "Fitness Facility License Renewal",
    description_template:
      "State fitness facility registration or health club license. Required in most states; protects members under consumer protection laws.",
    deadline_type: "business_license",
    agency_template: "${state} Department of Consumer Affairs",
    frequency: "annual",
    due_date_rule: { kind: "years_from_today", years: 1 },
    applies_when: { industry: "fitness" },
    severity_tier: "medium",
    penalty_estimate_cents: 25000,
    source_url: null,
    statute_citation: null,
  },
  {
    id: "20000000-0000-4000-8000-0000000000d1",
    rule_key: "industry-fitness-trainer-cert",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: "fitness",
    name_template: "Personal Trainer / Instructor Certifications",
    description_template:
      "Track expiry for staff CPT, group fitness, and CPR/AED certifications. Many states require proof of certification for insurance compliance.",
    deadline_type: "employee_cert",
    agency_template: "NASM / ACE / NSCA",
    frequency: "biennial",
    due_date_rule: { kind: "years_from_today", years: 1 },
    applies_when: { industry: "fitness" },
    severity_tier: "medium",
    penalty_estimate_cents: 10000,
    source_url: null,
    statute_citation: null,
  },

  // ── Industry: Transportation ──
  {
    id: "20000000-0000-4000-8000-0000000000e0",
    rule_key: "industry-transportation-usdot-biennial-update",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: "transportation",
    name_template: "USDOT Number Biennial Update",
    description_template:
      "FMCSA requires carriers to update their USDOT number information every 2 years and within 30 days of operational changes.",
    deadline_type: "business_license",
    agency_template: "FMCSA / USDOT",
    frequency: "biennial",
    due_date_rule: { kind: "years_from_today", years: 2 },
    applies_when: { industry: "transportation" },
    severity_tier: "critical",
    penalty_estimate_cents: 1100000,
    source_url: "https://www.fmcsa.dot.gov/registration/usdot-number",
    statute_citation: "49 CFR 390.19",
  },
  {
    id: "20000000-0000-4000-8000-0000000000e1",
    rule_key: "industry-transportation-commercial-vehicle-registration",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: "transportation",
    name_template: "Commercial Vehicle Registration Renewal",
    description_template:
      "Annual registration renewal for all commercial vehicles. Verify deadlines per vehicle with your state DMV.",
    deadline_type: "business_license",
    agency_template: "${state} DMV / DOT",
    frequency: "annual",
    due_date_rule: { kind: "years_from_today", years: 1 },
    applies_when: { industry: "transportation" },
    severity_tier: "high",
    penalty_estimate_cents: 50000,
    source_url: null,
    statute_citation: null,
  },
  {
    id: "20000000-0000-4000-8000-0000000000e2",
    rule_key: "industry-transportation-cdl-renewals",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: "transportation",
    name_template: "CDL / Driver License Renewals",
    description_template:
      "Track CDL renewal deadlines for all commercial drivers. CDLs expire every 4–8 years depending on state; medical certificates every 2 years.",
    deadline_type: "employee_cert",
    agency_template: "${state} DMV",
    frequency: "biennial",
    due_date_rule: { kind: "years_from_today", years: 2 },
    applies_when: { industry: "transportation", has_employees: true },
    severity_tier: "high",
    penalty_estimate_cents: 250000,
    source_url: null,
    statute_citation: null,
  },

  // ── Industry: Manufacturing ──
  {
    id: "20000000-0000-4000-8000-0000000000f0",
    rule_key: "industry-manufacturing-epa-hazardous-waste",
    rule_version: 1,
    jurisdiction_type: "federal",
    jurisdiction_code: "US",
    industry_slug: "manufacturing",
    name_template: "EPA Hazardous Waste Annual Report",
    description_template:
      "Large-quantity generators must submit an annual hazardous waste report to the EPA by March 1. Small-quantity generators may have reporting obligations.",
    deadline_type: "equipment_inspection",
    agency_template: "EPA",
    frequency: "annual",
    due_date_rule: { kind: "next_md", month: 2, day: 1 },
    applies_when: { industry: "manufacturing" },
    severity_tier: "high",
    penalty_estimate_cents: 5000000,
    source_url: "https://www.epa.gov/hwgenerators",
    statute_citation: "40 CFR 262",
  },
  {
    id: "20000000-0000-4000-8000-0000000000f1",
    rule_key: "industry-manufacturing-air-permit",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: "manufacturing",
    name_template: "Air Permit / Emissions Reporting",
    description_template:
      "Annual air quality permit renewal and emissions inventory report. Timing varies by state and permit class. Verify with your state environmental agency.",
    deadline_type: "business_license",
    agency_template: "${state} Environmental Agency",
    frequency: "annual",
    due_date_rule: { kind: "years_from_today", years: 1 },
    applies_when: { industry: "manufacturing" },
    severity_tier: "high",
    penalty_estimate_cents: 2500000,
    source_url: null,
    statute_citation: null,
  },

  // ── Industry: Business / Professional Services ──
  {
    id: "20000000-0000-4000-8000-000000000100",
    rule_key: "industry-business-services-eo-insurance",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: "business_services",
    name_template: "Professional Liability / E&O Insurance Renewal",
    description_template:
      "Errors & Omissions / professional liability policy renewal. Required by most state bars, accounting boards, and large client contracts.",
    deadline_type: "coi",
    agency_template: "Insurance Provider",
    frequency: "annual",
    due_date_rule: { kind: "years_from_today", years: 1 },
    applies_when: { industry: "business_services" },
    severity_tier: "high",
    penalty_estimate_cents: 250000,
    source_url: null,
    statute_citation: null,
  },
  {
    id: "20000000-0000-4000-8000-000000000101",
    rule_key: "industry-business-services-ce-credits",
    rule_version: 1,
    jurisdiction_type: "state",
    jurisdiction_code: "*",
    industry_slug: "business_services",
    name_template: "CPA / Bar / Licensing-Board CE Credits",
    description_template:
      "Continuing education requirements for licensed practitioners (CPA, attorney, EA, CFP). Track CE hours and reporting deadlines for each licensed staff member.",
    deadline_type: "employee_cert",
    agency_template: "${state} Professional Licensing Board",
    frequency: "biennial",
    due_date_rule: { kind: "years_from_today", years: 1 },
    applies_when: { industry: "business_services" },
    severity_tier: "high",
    penalty_estimate_cents: 50000,
    source_url: null,
    statute_citation: null,
  },
];

export const LEGACY_RULES: RuleDef[] = [...CORE_RULES, ...STATE_FALLBACK_RULES];

// Convenience predicate the snapshot test asserts on.
export function ruleCount(): number {
  return LEGACY_RULES.length;
}

// Convenience exported for the seed migration generator (not used at runtime).
export const _EXPLICITLY_HANDLED_STATES = EXPLICITLY_HANDLED_STATES;

// ─── Runtime DB loader ──────────────────────────────────────────────────────
//
// At request time, onboarding loads the canonical rule set from the DB so
// admin verifies (and, after Workstream B, accountant corrections) flow
// through to new businesses without a redeploy. Reads are cached per
// process for 10 minutes — onboarding throughput is low and rules barely
// move, so this is the right tradeoff. The cache can be invalidated
// explicitly after an admin mutation (`invalidateRulesCache()`).

const DueDateRuleSchema: z.ZodType<DueDateRule> = z.union([
  z.object({ kind: z.literal("next_md"), month: z.number().int(), day: z.number().int() }),
  z.object({ kind: z.literal("next_year_md"), month: z.number().int(), day: z.number().int() }),
  z.object({ kind: z.literal("months_from_today"), months: z.number().int() }),
  z.object({ kind: z.literal("years_from_today"), years: z.number().int() }),
  z.object({ kind: z.literal("years_from_today_first_of_month"), years: z.number().int() }),
  z.object({ kind: z.literal("next_month_day"), day: z.number().int() }),
  z.object({ kind: z.literal("quarterly_941"), count: z.number().int().positive() }),
]);

const EntityTypeSchema = z.enum([
  "llc",
  "s_corp",
  "c_corp",
  "sole_proprietor",
  "partnership",
  "nonprofit",
]);

const IndustrySchema = z.enum([
  "restaurant",
  "construction",
  "healthcare",
  "retail",
  "personal_services",
  "business_services",
  "manufacturing",
  "transportation",
  "fitness",
  "other",
]);

const AppliesWhenSchema: z.ZodType<AppliesWhen> = z.object({
  state: z.string().length(2).optional(),
  state_in: z.array(z.string().length(2)).optional(),
  state_not_in: z.array(z.string().length(2)).optional(),
  state_any: z.literal(true).optional(),
  entity_in: z.array(EntityTypeSchema).optional(),
  industry: IndustrySchema.optional(),
  hires_contractors: z.boolean().optional(),
  has_employees: z.boolean().optional(),
  osha_required: z.boolean().optional(),
});

const SeverityTierSchema: z.ZodType<SeverityTier> = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

const JurisdictionTypeSchema = z.enum(["federal", "state", "local"]);

// DB-row shape — names match the regulatory_rules table columns, not the
// RuleDef shape (which uses *_template names). Mapping happens in
// `dbRowToRuleDef`.
const DbRuleRowSchema = z.object({
  id: z.string().uuid(),
  jurisdiction_type: JurisdictionTypeSchema,
  jurisdiction_code: z.string(),
  industry_slug: z.string().nullable(),
  rule_key: z.string(),
  name: z.string(),
  description: z.string(),
  deadline_type: z.string(),
  governing_agency: z.string(),
  frequency: z.string(),
  due_date_rule: DueDateRuleSchema,
  applies_when: AppliesWhenSchema,
  severity_tier: SeverityTierSchema,
  penalty_estimate_cents: z.number().int().nullable(),
  source_url: z.string().nullable(),
  statute_citation: z.string().nullable(),
  version: z.number().int().positive(),
});

function dbRowToRuleDef(row: z.infer<typeof DbRuleRowSchema>): RuleDef {
  return {
    id: row.id,
    rule_key: row.rule_key,
    rule_version: row.version,
    jurisdiction_type: row.jurisdiction_type,
    jurisdiction_code: row.jurisdiction_code,
    industry_slug: row.industry_slug as Industry | null,
    name_template: row.name,
    description_template: row.description,
    deadline_type: row.deadline_type,
    agency_template: row.governing_agency,
    frequency: row.frequency,
    due_date_rule: row.due_date_rule,
    applies_when: row.applies_when,
    severity_tier: row.severity_tier,
    penalty_estimate_cents: row.penalty_estimate_cents,
    source_url: row.source_url,
    statute_citation: row.statute_citation,
  };
}

const CACHE_TTL_MS = 10 * 60 * 1000;
let rulesCache: { at: number; rules: RuleDef[]; source: "db" | "fallback" } | null = null;

// Narrow shape for the supabase client surface we depend on. Lets tests
// inject a mock without dragging in the full SupabaseClient type (and the
// regulatory_rules table isn't in the generated Database type yet anyway).
export type RulesClient = {
  from(table: "regulatory_rules"): {
    select(cols: string): {
      is(col: "sunset_date" | "superseded_by", value: null): {
        is(col: "sunset_date" | "superseded_by", value: null): Promise<{
          data: unknown[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

const RULE_SELECT_COLS =
  "id, jurisdiction_type, jurisdiction_code, industry_slug, rule_key, " +
  "name, description, deadline_type, governing_agency, frequency, " +
  "due_date_rule, applies_when, severity_tier, penalty_estimate_cents, " +
  "source_url, statute_citation, version";

export type LoadActiveRulesResult = {
  rules: RuleDef[];
  source: "db" | "fallback" | "cache";
  invalid_row_count?: number;
};

/**
 * Fetch the canonical active rule set. Uses an in-process cache (TTL 10
 * min). On any failure — table missing, RLS reject, DB unreachable,
 * empty result — falls back to LEGACY_RULES so onboarding never breaks.
 * Each invalid row (failing Zod validation) is skipped and counted; the
 * surrounding query still succeeds.
 */
export async function loadActiveRules(opts?: {
  client?: RulesClient;
  bypassCache?: boolean;
  now?: number;
}): Promise<LoadActiveRulesResult> {
  const now = opts?.now ?? Date.now();

  if (!opts?.bypassCache && rulesCache && now - rulesCache.at < CACHE_TTL_MS) {
    return { rules: rulesCache.rules, source: "cache" };
  }

  let client = opts?.client;
  if (!client) {
    // Lazy-require so this file stays importable in unit tests without
    // pulling in the Next/Supabase server stack.
    const { createClient } = await import("@/lib/supabase/server");
    client = (await createClient()) as unknown as RulesClient;
  }

  try {
    const { data, error } = await client
      .from("regulatory_rules")
      .select(RULE_SELECT_COLS)
      .is("sunset_date", null)
      .is("superseded_by", null);

    if (error || !data || data.length === 0) {
      if (error) {
        console.warn("regulatory-graph: DB query failed, falling back", {
          error: error.message,
        });
      }
      rulesCache = { at: now, rules: LEGACY_RULES, source: "fallback" };
      return { rules: LEGACY_RULES, source: "fallback" };
    }

    const rules: RuleDef[] = [];
    let invalidCount = 0;
    for (const row of data) {
      const parsed = DbRuleRowSchema.safeParse(row);
      if (!parsed.success) {
        invalidCount += 1;
        const rowId = (row as { id?: unknown }).id;
        console.warn("regulatory-graph: skipping invalid rule row", {
          id: typeof rowId === "string" ? rowId : "<no-id>",
          issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        });
        continue;
      }
      rules.push(dbRowToRuleDef(parsed.data));
    }

    if (rules.length === 0) {
      // Every row failed validation — same blast radius as empty/error.
      rulesCache = { at: now, rules: LEGACY_RULES, source: "fallback" };
      return { rules: LEGACY_RULES, source: "fallback", invalid_row_count: invalidCount };
    }

    rulesCache = { at: now, rules, source: "db" };
    return {
      rules,
      source: "db",
      ...(invalidCount > 0 ? { invalid_row_count: invalidCount } : {}),
    };
  } catch (e) {
    console.warn("regulatory-graph: exception during DB load, falling back", e);
    rulesCache = { at: now, rules: LEGACY_RULES, source: "fallback" };
    return { rules: LEGACY_RULES, source: "fallback" };
  }
}

/** Force-clear the in-process rule cache. Call from any admin mutation that
 *  changes rule output (edits, accepts a correction, sunsets a rule, etc.). */
export function invalidateRulesCache(): void {
  rulesCache = null;
}

/** Test-only inspector. */
export function _peekRulesCache(): typeof rulesCache {
  return rulesCache;
}
