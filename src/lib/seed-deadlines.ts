import type { OnboardingData } from "@/types/onboarding";
import { formatIsoDate } from "@/lib/deadline-utils";
import { requiresOshaLog } from "@/lib/onboarding-utils";

export type SeverityTier = "critical" | "high" | "medium" | "low" | "info";

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
};

type SeedMeta = {
  severity_tier?: SeverityTier;
  penalty_estimate_cents?: number | null;
  source_url?: string | null;
  statute_citation?: string | null;
};

type PartialSeed = Omit<
  DeadlineSeed,
  "business_id" | "source" | "severity_tier" | "penalty_estimate_cents" | "source_url" | "statute_citation"
> & SeedMeta;

const DEFAULT_SEVERITY: SeverityTier = "medium";

export function nextDate(month: number, day: number, referenceDate?: Date): Date {
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(today.getFullYear(), month, day);
  if (candidate <= today) candidate.setFullYear(candidate.getFullYear() + 1);
  return candidate;
}

export function next941Dates(n: number, referenceDate?: Date): Date[] {
  const quarterEnds = [
    [3, 30],
    [6, 31],
    [9, 31],
    [0, 31],
  ];
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);
  const candidates: Date[] = [];
  for (let year = today.getFullYear(); candidates.length < n; year++) {
    for (const [m, d] of quarterEnds) {
      const dt = new Date(year, m, d);
      if (dt > today) candidates.push(dt);
      if (candidates.length >= n) break;
    }
  }
  return candidates;
}

// 50-state + DC annual entity-filing rule table. Each entry encodes the
// agency name + typical filing month/day + frequency + source URL so the
// generic state block can produce a citable deadline for any state we don't
// explicitly hand-code.
type StateRule = {
  agency: string;
  month: number; // 0-indexed
  day: number;
  frequency: "annual" | "biennial" | "decennial";
  source_url: string;
  statute_citation?: string;
  late_fee_cents?: number;
};

const STATE_RULES: Record<string, StateRule> = {
  AL: { agency: "Alabama Secretary of State", month: 3, day: 15, frequency: "annual", source_url: "https://www.sos.alabama.gov/business-services" },
  AK: { agency: "Alaska Division of Corporations", month: 0, day: 2, frequency: "biennial", source_url: "https://www.commerce.alaska.gov/web/cbpl/corporations.aspx" },
  AZ: { agency: "Arizona Corporation Commission", month: 3, day: 15, frequency: "annual", source_url: "https://ecorp.azcc.gov/" },
  AR: { agency: "Arkansas Secretary of State", month: 4, day: 1, frequency: "annual", source_url: "https://www.sos.arkansas.gov/business-commercial-services-bcs", late_fee_cents: 2500000 },
  CO: { agency: "Colorado Secretary of State", month: 0, day: 31, frequency: "annual", source_url: "https://www.sos.state.co.us/biz/" },
  CT: { agency: "Connecticut Secretary of State", month: 3, day: 1, frequency: "annual", source_url: "https://business.ct.gov/" },
  DC: { agency: "DC Department of Licensing & Consumer Protection", month: 3, day: 1, frequency: "biennial", source_url: "https://dlcp.dc.gov/" },
  GA: { agency: "Georgia Secretary of State", month: 3, day: 1, frequency: "annual", source_url: "https://sos.ga.gov/corporations-division" },
  HI: { agency: "Hawaii Department of Commerce", month: 2, day: 31, frequency: "annual", source_url: "https://cca.hawaii.gov/breg/" },
  ID: { agency: "Idaho Secretary of State", month: 10, day: 30, frequency: "annual", source_url: "https://sosbiz.idaho.gov/" },
  IL: { agency: "Illinois Secretary of State", month: 1, day: 1, frequency: "annual", source_url: "https://www.ilsos.gov/departments/business_services/home.html", late_fee_cents: 30000 },
  IN: { agency: "Indiana Secretary of State", month: 3, day: 30, frequency: "biennial", source_url: "https://inbiz.in.gov/" },
  IA: { agency: "Iowa Secretary of State", month: 3, day: 1, frequency: "biennial", source_url: "https://sos.iowa.gov/business/" },
  KS: { agency: "Kansas Secretary of State", month: 3, day: 15, frequency: "annual", source_url: "https://sos.ks.gov/business/business-filing-center.html" },
  KY: { agency: "Kentucky Secretary of State", month: 5, day: 30, frequency: "annual", source_url: "https://sos.ky.gov/bus/" },
  LA: { agency: "Louisiana Secretary of State", month: 3, day: 15, frequency: "annual", source_url: "https://www.sos.la.gov/BusinessServices/" },
  ME: { agency: "Maine Secretary of State", month: 5, day: 1, frequency: "annual", source_url: "https://www.maine.gov/sos/cec/corp/" },
  MD: { agency: "Maryland State Department of Assessments", month: 3, day: 15, frequency: "annual", source_url: "https://dat.maryland.gov/" },
  MA: { agency: "Massachusetts Secretary of the Commonwealth", month: 2, day: 15, frequency: "annual", source_url: "https://www.sec.state.ma.us/cor/" },
  MI: { agency: "Michigan LARA Bureau of Corporations", month: 1, day: 15, frequency: "annual", source_url: "https://www.michigan.gov/lara/bureau-list/cscl" },
  MN: { agency: "Minnesota Secretary of State", month: 11, day: 31, frequency: "annual", source_url: "https://www.sos.state.mn.us/business-liens/" },
  MS: { agency: "Mississippi Secretary of State", month: 3, day: 15, frequency: "annual", source_url: "https://www.sos.ms.gov/business-services" },
  MO: { agency: "Missouri Secretary of State", month: 7, day: 30, frequency: "annual", source_url: "https://www.sos.mo.gov/business" },
  MT: { agency: "Montana Secretary of State", month: 3, day: 15, frequency: "annual", source_url: "https://sosmt.gov/business/" },
  NE: { agency: "Nebraska Secretary of State", month: 3, day: 1, frequency: "biennial", source_url: "https://sos.nebraska.gov/business-services" },
  NV: { agency: "Nevada Secretary of State", month: 0, day: 31, frequency: "annual", source_url: "https://www.nvsos.gov/sos/businesses/" },
  NH: { agency: "New Hampshire Secretary of State", month: 3, day: 1, frequency: "annual", source_url: "https://quickstart.sos.nh.gov/" },
  NJ: { agency: "New Jersey Division of Revenue", month: 3, day: 30, frequency: "annual", source_url: "https://www.nj.gov/treasury/revenue/" },
  NM: { agency: "New Mexico Secretary of State", month: 3, day: 15, frequency: "biennial", source_url: "https://www.sos.state.nm.us/business-services/" },
  NC: { agency: "North Carolina Secretary of State", month: 3, day: 15, frequency: "annual", source_url: "https://www.sosnc.gov/divisions/business_registration" },
  ND: { agency: "North Dakota Secretary of State", month: 10, day: 1, frequency: "annual", source_url: "https://sos.nd.gov/business/" },
  OH: { agency: "Ohio Secretary of State", month: 3, day: 15, frequency: "annual", source_url: "https://www.ohiosos.gov/businesses/" },
  OK: { agency: "Oklahoma Secretary of State", month: 5, day: 30, frequency: "annual", source_url: "https://www.sos.ok.gov/business/" },
  OR: { agency: "Oregon Secretary of State", month: 11, day: 31, frequency: "annual", source_url: "https://sos.oregon.gov/business/" },
  PA: { agency: "Pennsylvania Department of State", month: 5, day: 30, frequency: "decennial", source_url: "https://www.dos.pa.gov/BusinessCharities/" },
  RI: { agency: "Rhode Island Department of State", month: 1, day: 1, frequency: "annual", source_url: "https://www.sos.ri.gov/divisions/business-services" },
  SC: { agency: "South Carolina Secretary of State", month: 2, day: 15, frequency: "annual", source_url: "https://sos.sc.gov/online-filings" },
  SD: { agency: "South Dakota Secretary of State", month: 0, day: 31, frequency: "annual", source_url: "https://sosenterprise.sd.gov/" },
  TN: { agency: "Tennessee Secretary of State", month: 3, day: 1, frequency: "annual", source_url: "https://sos.tn.gov/business-services" },
  UT: { agency: "Utah Division of Corporations", month: 3, day: 15, frequency: "annual", source_url: "https://corporations.utah.gov/" },
  VT: { agency: "Vermont Secretary of State", month: 2, day: 15, frequency: "annual", source_url: "https://sos.vermont.gov/corporations/" },
  VA: { agency: "Virginia State Corporation Commission", month: 11, day: 31, frequency: "annual", source_url: "https://www.scc.virginia.gov/clk/" },
  WA: { agency: "Washington Secretary of State", month: 3, day: 30, frequency: "annual", source_url: "https://www.sos.wa.gov/corporations/" },
  WV: { agency: "West Virginia Secretary of State", month: 5, day: 30, frequency: "annual", source_url: "https://sos.wv.gov/business/Pages/default.aspx" },
  WI: { agency: "Wisconsin Department of Financial Institutions", month: 3, day: 1, frequency: "annual", source_url: "https://www.wdfi.org/corporations/" },
  WY: { agency: "Wyoming Secretary of State", month: 0, day: 1, frequency: "annual", source_url: "https://wyobiz.wyo.gov/" },
};

// States with their own explicit blocks — STATE_RULES fallback should skip these.
const EXPLICITLY_HANDLED_STATES = new Set(["CA", "TX", "NY", "DE", "FL"]);

function stateDeadlines(
  data: OnboardingData,
  today: Date,
  nd: (month: number, day: number) => Date
): PartialSeed[] {
  const { state, entityType } = data;
  const out: PartialSeed[] = [];

  if (state === "CA") {
    if (entityType === "llc" || entityType === "s_corp" || entityType === "c_corp") {
      out.push({
        name: "California Minimum Franchise Tax ($800)",
        description:
          "California imposes an $800 annual minimum franchise tax on all LLCs, S-Corps, and C-Corps registered in the state, regardless of income or activity. Due April 15 for calendar-year entities (Form 3522).",
        deadline_type: "tax_filing",
        governing_agency: "California Franchise Tax Board (FTB)",
        frequency: "annual",
        due_date: formatIsoDate(nd(3, 15)),
        severity_tier: "critical",
        penalty_estimate_cents: 80000,
        source_url: "https://www.ftb.ca.gov/file/business/types/limited-liability-company/index.html",
        statute_citation: "CA Rev & Tax Code §17941",
      });
    }
    if (entityType === "llc") {
      out.push({
        name: "CA LLC Statement of Information",
        description:
          "California LLCs must file a Statement of Information with the Secretary of State annually within 90 days of formation, then every two years. $20 filing fee.",
        deadline_type: "entity_filing",
        governing_agency: "California Secretary of State",
        frequency: "biennial",
        due_date: formatIsoDate(nd(3, 15)),
        severity_tier: "high",
        penalty_estimate_cents: 25000,
        source_url: "https://bizfileonline.sos.ca.gov/",
        statute_citation: "CA Corp Code §17702.09",
      });
    }
    if (data.employeeRange && data.employeeRange !== "1") {
      out.push({
        name: "California SDI / Payroll Tax Registration",
        description:
          "California employers must register with the EDD for State Disability Insurance (SDI) and Unemployment Insurance (UI). Quarterly DE 9 / DE 9C payroll tax returns are due.",
        deadline_type: "tax_filing",
        governing_agency: "California EDD",
        frequency: "quarterly",
        due_date: formatIsoDate(nd(3, 30)),
        severity_tier: "high",
        penalty_estimate_cents: 50000,
        source_url: "https://edd.ca.gov/Payroll_Taxes/",
        statute_citation: "CA Unemployment Insurance Code §1112",
      });
    }
  }

  if (state === "TX") {
    if (entityType && ["llc", "s_corp", "c_corp", "partnership"].includes(entityType)) {
      out.push({
        name: "Texas Franchise Tax Report",
        description:
          "Texas imposes a franchise (margin) tax on LLCs, corporations, and partnerships. Annual Public Information Report and tax return due May 15. No-tax-due threshold applies for small businesses under ~$2.47M revenue.",
        deadline_type: "tax_filing",
        governing_agency: "Texas Comptroller of Public Accounts",
        frequency: "annual",
        due_date: formatIsoDate(nd(4, 15)),
        severity_tier: "high",
        penalty_estimate_cents: 5000,
        source_url: "https://comptroller.texas.gov/taxes/franchise/",
        statute_citation: "TX Tax Code Ch. 171",
      });
    }
  }

  if (state === "NY") {
    if (entityType === "llc") {
      out.push({
        name: "New York LLC Biennial Statement",
        description:
          "New York LLCs must file a Biennial Statement with the Department of State every two years by the end of the anniversary month of formation. $9 fee online.",
        deadline_type: "entity_filing",
        governing_agency: "New York Department of State",
        frequency: "biennial",
        due_date: formatIsoDate(new Date(today.getFullYear() + 2, today.getMonth(), 1)),
        severity_tier: "medium",
        penalty_estimate_cents: 25000,
        source_url: "https://dos.ny.gov/biennial-statements",
        statute_citation: "NY LLC Law §301",
      });
    }
    if (entityType === "s_corp" || entityType === "c_corp") {
      out.push({
        name: "New York Corporation Biennial Statement",
        description:
          "NY domestic and foreign corporations must file a biennial statement with the Department of State. Due by January 31 of the applicable year.",
        deadline_type: "entity_filing",
        governing_agency: "New York Department of State",
        frequency: "biennial",
        due_date: formatIsoDate(nd(0, 31)),
        severity_tier: "medium",
        penalty_estimate_cents: 25000,
        source_url: "https://dos.ny.gov/biennial-statements",
        statute_citation: "NY BCL §408",
      });
    }
  }

  if (state === "DE") {
    if (entityType === "llc") {
      out.push({
        name: "Delaware LLC Annual Tax",
        description:
          "All Delaware LLCs must pay a $300 annual tax by June 1, regardless of activity or income. Failure to pay results in void status and $200 penalty.",
        deadline_type: "tax_filing",
        governing_agency: "Delaware Division of Corporations",
        frequency: "annual",
        due_date: formatIsoDate(nd(5, 1)),
        severity_tier: "critical",
        penalty_estimate_cents: 20000,
        source_url: "https://corp.delaware.gov/paytaxes/",
        statute_citation: "8 DE Code §132",
      });
    }
    if (entityType === "c_corp" || entityType === "s_corp") {
      out.push({
        name: "Delaware Franchise Tax (Annual Report)",
        description:
          "Delaware corporations must file an annual report and pay franchise tax by March 1. Minimum $50 (Authorized Shares method) or potentially thousands under Assumed Par Value Capital method. All registered agents notify due December–February.",
        deadline_type: "tax_filing",
        governing_agency: "Delaware Division of Corporations",
        frequency: "annual",
        due_date: formatIsoDate(nd(2, 1)),
        severity_tier: "critical",
        penalty_estimate_cents: 20000,
        source_url: "https://corp.delaware.gov/paytaxes/",
        statute_citation: "8 DE Code §503",
      });
    }
  }

  if (state === "FL") {
    if (entityType && ["llc", "s_corp", "c_corp"].includes(entityType)) {
      out.push({
        name: "Florida Annual Report",
        description:
          "All Florida business entities must file an annual report with the Division of Corporations by May 1. $138.75 for LLCs, $150 for corporations. Late fee: $400.",
        deadline_type: "entity_filing",
        governing_agency: "Florida Division of Corporations (Sunbiz)",
        frequency: "annual",
        due_date: formatIsoDate(nd(4, 1)),
        severity_tier: "high",
        penalty_estimate_cents: 40000,
        source_url: "https://dos.fl.gov/sunbiz/",
        statute_citation: "Fla. Stat. §605.0212",
      });
    }
  }

  // Generic fallback for the remaining 45 states + DC.
  if (
    !EXPLICITLY_HANDLED_STATES.has(state) &&
    STATE_RULES[state] &&
    entityType &&
    ["llc", "s_corp", "c_corp"].includes(entityType)
  ) {
    const rule = STATE_RULES[state];
    out.push({
      name: `${state} ${rule.frequency === "biennial" ? "Biennial" : rule.frequency === "decennial" ? "Decennial" : "Annual"} Entity Report`,
      description: `${rule.frequency === "decennial" ? "Decennial" : rule.frequency === "biennial" ? "Biennial" : "Annual"} entity report filed with the ${rule.agency}. Failure to file can result in administrative dissolution. Verify filing window and fee at the agency portal.`,
      deadline_type: "entity_filing",
      governing_agency: rule.agency,
      frequency: rule.frequency,
      due_date: formatIsoDate(nd(rule.month, rule.day)),
      severity_tier: "high",
      penalty_estimate_cents: rule.late_fee_cents ?? 10000,
      source_url: rule.source_url,
      statute_citation: rule.statute_citation ?? null,
    });
  }

  return out;
}

/**
 * Builds the starter set of compliance deadlines for a new business.
 * Pure function — no side effects, no network calls.
 */
export function buildStarterDeadlines(
  data: OnboardingData,
  businessId: string,
  referenceDate?: Date
): DeadlineSeed[] {
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);
  const nextYear = new Date(today);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const hasEmployees = data.employeeRange !== null && data.employeeRange !== "1";

  const deadlines: DeadlineSeed[] = [];

  function push(d: PartialSeed) {
    deadlines.push({
      business_id: businessId,
      source: "discovery_agent",
      severity_tier: d.severity_tier ?? DEFAULT_SEVERITY,
      penalty_estimate_cents: d.penalty_estimate_cents ?? null,
      source_url: d.source_url ?? null,
      statute_citation: d.statute_citation ?? null,
      name: d.name,
      description: d.description,
      deadline_type: d.deadline_type,
      governing_agency: d.governing_agency,
      frequency: d.frequency,
      due_date: d.due_date,
    });
  }

  function nd(month: number, day: number): Date {
    return nextDate(month, day, today);
  }

  // Entity filing (generic per-state). Explicitly-handled states emit richer
  // versions from stateDeadlines(); this remains a baseline for everyone else.
  if (data.entityType && ["llc", "s_corp", "c_corp"].includes(data.entityType)) {
    push({
      name: `${data.state} Annual Report / Entity Filing`,
      description: `Annual state entity report for ${data.entityType.toUpperCase()} in ${data.state}. Failure to file can result in administrative dissolution.`,
      deadline_type: "entity_filing",
      governing_agency: `${data.state} Secretary of State`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
      severity_tier: "high",
      penalty_estimate_cents: 10000,
      source_url: STATE_RULES[data.state]?.source_url ?? null,
    });
  }

  const licenseDate = new Date(today);
  licenseDate.setMonth(licenseDate.getMonth() + 11);
  push({
    name: "Business License Renewal",
    description:
      "City/county general business operating license renewal. Verify exact due date with your local licensing office.",
    deadline_type: "business_license",
    governing_agency: "City / County Business Office",
    frequency: "annual",
    due_date: formatIsoDate(licenseDate),
    severity_tier: "medium",
    penalty_estimate_cents: 5000,
  });

  // Federal income tax
  if (data.entityType === "s_corp" || data.entityType === "partnership") {
    push({
      name: "Federal Business Tax Return (Form 1120-S / 1065)",
      description:
        "S-Corp and partnership federal income tax return due March 15. File Form 7004 for a 6-month extension.",
      deadline_type: "tax_filing",
      governing_agency: "IRS",
      frequency: "annual",
      due_date: formatIsoDate(nd(2, 15)),
      severity_tier: "critical",
      penalty_estimate_cents: 21000,
      source_url: "https://www.irs.gov/businesses/small-businesses-self-employed/s-corporations",
      statute_citation: "IRC §6699",
    });
  } else if (data.entityType === "c_corp") {
    push({
      name: "Federal Corporate Tax Return (Form 1120)",
      description:
        "C-Corp federal income tax return due April 15. File Form 7004 for a 6-month extension.",
      deadline_type: "tax_filing",
      governing_agency: "IRS",
      frequency: "annual",
      due_date: formatIsoDate(nd(3, 15)),
      severity_tier: "critical",
      penalty_estimate_cents: 50000,
      source_url: "https://www.irs.gov/forms-pubs/about-form-1120",
      statute_citation: "IRC §6651",
    });
  } else {
    push({
      name: "Federal Income Tax Return (Schedule C / 1040)",
      description: "Individual federal income tax return including business income. Due April 15.",
      deadline_type: "tax_filing",
      governing_agency: "IRS",
      frequency: "annual",
      due_date: formatIsoDate(nd(3, 15)),
      severity_tier: "high",
      penalty_estimate_cents: 50000,
      source_url: "https://www.irs.gov/forms-pubs/about-form-1040",
      statute_citation: "IRC §6651",
    });
  }

  // Quarterly estimated taxes
  if (data.entityType !== "c_corp") {
    const estTaxDates = [
      { month: 3, day: 15, label: "Q1" },
      { month: 5, day: 17, label: "Q2" },
      { month: 8, day: 16, label: "Q3" },
      { month: 0, day: 15, label: "Q4" },
    ];
    for (const { month, day, label } of estTaxDates) {
      const dt = nd(month, day);
      if (dt <= nextYear) {
        push({
          name: `Federal Estimated Tax Payment — ${label}`,
          description: `IRS quarterly estimated tax payment (Form 1040-ES). Required if you expect to owe $1,000+ in taxes. ${label} payment due.`,
          deadline_type: "tax_filing",
          governing_agency: "IRS",
          frequency: "quarterly",
          due_date: formatIsoDate(dt),
          severity_tier: "high",
          penalty_estimate_cents: 15000,
          source_url: "https://www.irs.gov/forms-pubs/about-form-1040-es",
          statute_citation: "IRC §6654",
        });
      }
    }
  }

  // Payroll
  if (hasEmployees) {
    const dates941 = next941Dates(2, today);
    for (const dt of dates941) {
      push({
        name: "Quarterly Payroll Tax Filing (Form 941)",
        description:
          "IRS Form 941 — quarterly payroll tax return reporting employee wages, tips, and federal withholding. Late filing penalty: 5% per month.",
        deadline_type: "tax_filing",
        governing_agency: "IRS",
        frequency: "quarterly",
        due_date: formatIsoDate(dt),
        severity_tier: "critical",
        penalty_estimate_cents: 200000,
        source_url: "https://www.irs.gov/forms-pubs/about-form-941",
        statute_citation: "IRC §6651, §6656 (failure-to-deposit)",
      });
    }

    push({
      name: "Annual FUTA Tax Return (Form 940)",
      description:
        "IRS Form 940 — annual Federal Unemployment Tax Act return. Due January 31. Deposit may be required quarterly if FUTA liability exceeds $500.",
      deadline_type: "tax_filing",
      governing_agency: "IRS",
      frequency: "annual",
      due_date: formatIsoDate(nd(0, 31)),
      severity_tier: "high",
      penalty_estimate_cents: 50000,
      source_url: "https://www.irs.gov/forms-pubs/about-form-940",
      statute_citation: "IRC §3301",
    });

    push({
      name: "W-2 / 1099 Filing Deadline",
      description:
        "File W-2s with SSA and distribute to employees by January 31. File 1099-NEC forms for contractors paid $600+.",
      deadline_type: "tax_filing",
      governing_agency: "IRS / SSA",
      frequency: "annual",
      due_date: formatIsoDate(nd(0, 31)),
      severity_tier: "high",
      penalty_estimate_cents: 6000,
      source_url: "https://www.irs.gov/forms-pubs/about-form-w-2",
      statute_citation: "IRC §6721",
    });

    const wcDate = new Date(today);
    wcDate.setMonth(wcDate.getMonth() + 10);
    push({
      name: "Workers' Compensation Insurance Renewal",
      description:
        "Annual workers' comp policy renewal. Required by law in most states for businesses with employees. Verify your policy expiry date.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Workers' Comp Board`,
      frequency: "annual",
      due_date: formatIsoDate(wcDate),
      severity_tier: "critical",
      penalty_estimate_cents: 500000,
    });
  }

  // OSHA 300 — note: 10+ employee threshold; current bucket "6-15" can include
  // 6-9 employee businesses. Kept as-is to preserve seeded behavior; thresholds
  // here are best-effort given the coarse employee range buckets in onboarding.
  if (requiresOshaLog(data.employeeRange)) {
    push({
      name: "OSHA 300 Log — Annual Summary Posting",
      description:
        "Post the OSHA 300A annual summary of work-related injuries and illnesses from Feb 1 – Apr 30.",
      deadline_type: "equipment_inspection",
      governing_agency: "OSHA (Federal / State)",
      frequency: "annual",
      due_date: formatIsoDate(new Date(today.getFullYear() + 1, 1, 1)),
      severity_tier: "medium",
      penalty_estimate_cents: 1500000,
      source_url: "https://www.osha.gov/recordkeeping",
      statute_citation: "29 CFR 1904",
    });
  }

  if (data.hiresContractors) {
    push({
      name: "1099-NEC Filing for Contractors",
      description:
        "File 1099-NEC forms with the IRS and send copies to all contractors paid $600+ during the year. Due January 31.",
      deadline_type: "tax_filing",
      governing_agency: "IRS",
      frequency: "annual",
      due_date: formatIsoDate(nd(0, 31)),
      severity_tier: "high",
      penalty_estimate_cents: 6000,
      source_url: "https://www.irs.gov/forms-pubs/about-form-1099-nec",
      statute_citation: "IRC §6041A",
    });
  }

  for (const d of stateDeadlines(data, today, nd)) {
    push(d);
  }

  // ── Industry blocks ───────────────────────────────────────────────────────
  if (data.industry === "restaurant") {
    const healthDate = new Date(today);
    healthDate.setMonth(healthDate.getMonth() + 6);
    push({
      name: "Food Service / Health Permit Renewal",
      description:
        "Annual food service establishment permit required by your local health department.",
      deadline_type: "business_license",
      governing_agency: "County Health Department",
      frequency: "annual",
      due_date: formatIsoDate(healthDate),
      severity_tier: "critical",
      penalty_estimate_cents: 100000,
    });
    push({
      name: "Food Handler Certifications (Staff)",
      description:
        "Track expiry for all food handler cards / ServSafe certifications for front-of-house and kitchen staff.",
      deadline_type: "employee_cert",
      governing_agency: "State Health Department",
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
      severity_tier: "high",
      penalty_estimate_cents: 25000,
      source_url: "https://www.servsafe.com/",
    });
    push({
      name: "State Sales Tax Filing — Monthly",
      description:
        "Monthly state sales tax return for food/beverage sales. Verify filing frequency with your state revenue department.",
      deadline_type: "tax_filing",
      governing_agency: `${data.state} Department of Revenue`,
      frequency: "monthly",
      due_date: formatIsoDate(
        nd(today.getMonth() + 1 > 11 ? 0 : today.getMonth() + 1, 20)
      ),
      severity_tier: "high",
      penalty_estimate_cents: 20000,
    });
  }

  if (data.industry === "construction") {
    push({
      name: "Contractor License Renewal",
      description:
        "State contractor license renewal. Required to legally bid and perform work.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Contractors Licensing Board`,
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
      severity_tier: "critical",
      penalty_estimate_cents: 500000,
    });
    if (data.hiresContractors) {
      push({
        name: "Subcontractor COI Renewals",
        description:
          "Certificate of Insurance renewals for all active subcontractors. Expired COIs expose you to liability.",
        deadline_type: "coi",
        governing_agency: "Insurance Provider",
        frequency: "annual",
        due_date: formatIsoDate(nextYear),
        severity_tier: "high",
        penalty_estimate_cents: 250000,
      });
    }
  }

  if (data.industry === "healthcare") {
    push({
      name: "Professional License Renewals",
      description:
        "Track all staff professional license renewals (RN, MD, PT, etc.) and continuing education requirements.",
      deadline_type: "employee_cert",
      governing_agency: `${data.state} Professional Licensing Board`,
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
      severity_tier: "critical",
      penalty_estimate_cents: 1000000,
    });
    push({
      name: "DEA Registration Renewal",
      description:
        "DEA practitioner registration renewal required for any provider authorized to prescribe controlled substances. Typically triennial.",
      deadline_type: "business_license",
      governing_agency: "DEA",
      frequency: "triennial",
      due_date: formatIsoDate(
        new Date(today.getFullYear() + 3, today.getMonth(), today.getDate())
      ),
      severity_tier: "critical",
      penalty_estimate_cents: 1000000,
      source_url: "https://www.deadiversion.usdoj.gov/drugreg/",
      statute_citation: "21 USC §822",
    });
    push({
      name: "HIPAA Security Risk Assessment",
      description:
        "Annual HIPAA Security Rule risk analysis required for all covered entities and business associates. Document findings and remediation plan.",
      deadline_type: "equipment_inspection",
      governing_agency: "HHS / OCR",
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
      severity_tier: "high",
      penalty_estimate_cents: 10000000,
      source_url: "https://www.hhs.gov/hipaa/for-professionals/security/",
      statute_citation: "45 CFR 164.308(a)(1)",
    });
  }

  if (data.industry === "retail") {
    push({
      name: "State Sales Tax Filing",
      description:
        "Monthly or quarterly state sales tax return. Verify your filing frequency — high-volume retailers file monthly.",
      deadline_type: "tax_filing",
      governing_agency: `${data.state} Department of Revenue`,
      frequency: "monthly",
      due_date: formatIsoDate(
        nd(today.getMonth() + 1 > 11 ? 0 : today.getMonth() + 1, 20)
      ),
      severity_tier: "high",
      penalty_estimate_cents: 20000,
    });
    push({
      name: "Seller's Permit / Retail License Renewal",
      description:
        "State retail seller's permit renewal. Required to collect and remit sales tax. Verify renewal period with your state.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Department of Revenue`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
      severity_tier: "high",
      penalty_estimate_cents: 50000,
    });
  }

  if (data.industry === "personal_services") {
    push({
      name: "Cosmetology / Trade License Renewal",
      description:
        "State professional board license renewal for barbers, cosmetologists, estheticians, and nail technicians. Required for all licensed staff.",
      deadline_type: "employee_cert",
      governing_agency: `${data.state} Board of Cosmetology`,
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
      severity_tier: "high",
      penalty_estimate_cents: 50000,
    });
    push({
      name: "Establishment License Renewal",
      description:
        "State facility license for salon, spa, or personal service establishment. Separate from individual staff licenses.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Board of Cosmetology / Health`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
      severity_tier: "high",
      penalty_estimate_cents: 50000,
    });
  }

  if (data.industry === "fitness") {
    push({
      name: "Fitness Facility License Renewal",
      description:
        "State fitness facility registration or health club license. Required in most states; protects members under consumer protection laws.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Department of Consumer Affairs`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
      severity_tier: "medium",
      penalty_estimate_cents: 25000,
    });
    push({
      name: "Personal Trainer / Instructor Certifications",
      description:
        "Track expiry for staff CPT, group fitness, and CPR/AED certifications. Many states require proof of certification for insurance compliance.",
      deadline_type: "employee_cert",
      governing_agency: "NASM / ACE / NSCA",
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
      severity_tier: "medium",
      penalty_estimate_cents: 10000,
    });
  }

  if (data.industry === "transportation") {
    push({
      name: "USDOT Number Biennial Update",
      description:
        "FMCSA requires carriers to update their USDOT number information every 2 years and within 30 days of operational changes.",
      deadline_type: "business_license",
      governing_agency: "FMCSA / USDOT",
      frequency: "biennial",
      due_date: formatIsoDate(
        new Date(today.getFullYear() + 2, today.getMonth(), today.getDate())
      ),
      severity_tier: "critical",
      penalty_estimate_cents: 1100000,
      source_url: "https://www.fmcsa.dot.gov/registration/usdot-number",
      statute_citation: "49 CFR 390.19",
    });
    push({
      name: "Commercial Vehicle Registration Renewal",
      description:
        "Annual registration renewal for all commercial vehicles. Verify deadlines per vehicle with your state DMV.",
      deadline_type: "business_license",
      governing_agency: `${data.state} DMV / DOT`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
      severity_tier: "high",
      penalty_estimate_cents: 50000,
    });
    if (hasEmployees) {
      push({
        name: "CDL / Driver License Renewals",
        description:
          "Track CDL renewal deadlines for all commercial drivers. CDLs expire every 4–8 years depending on state; medical certificates every 2 years.",
        deadline_type: "employee_cert",
        governing_agency: `${data.state} DMV`,
        frequency: "biennial",
        due_date: formatIsoDate(
          new Date(today.getFullYear() + 2, today.getMonth(), today.getDate())
        ),
        severity_tier: "high",
        penalty_estimate_cents: 250000,
      });
    }
  }

  if (data.industry === "manufacturing") {
    push({
      name: "EPA Hazardous Waste Annual Report",
      description:
        "Large-quantity generators must submit an annual hazardous waste report to the EPA by March 1. Small-quantity generators may have reporting obligations.",
      deadline_type: "equipment_inspection",
      governing_agency: "EPA",
      frequency: "annual",
      due_date: formatIsoDate(nd(2, 1)),
      severity_tier: "high",
      penalty_estimate_cents: 5000000,
      source_url: "https://www.epa.gov/hwgenerators",
      statute_citation: "40 CFR 262",
    });
    push({
      name: "Air Permit / Emissions Reporting",
      description:
        "Annual air quality permit renewal and emissions inventory report. Timing varies by state and permit class. Verify with your state environmental agency.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Environmental Agency`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
      severity_tier: "high",
      penalty_estimate_cents: 2500000,
    });
  }

  // Business / professional services (accounting firms, law practices, consulting,
  // SaaS, agencies) — previously had no industry-specific coverage at all.
  if (data.industry === "business_services") {
    push({
      name: "Professional Liability / E&O Insurance Renewal",
      description:
        "Errors & Omissions / professional liability policy renewal. Required by most state bars, accounting boards, and large client contracts.",
      deadline_type: "coi",
      governing_agency: "Insurance Provider",
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
      severity_tier: "high",
      penalty_estimate_cents: 250000,
    });
    push({
      name: "CPA / Bar / Licensing-Board CE Credits",
      description:
        "Continuing education requirements for licensed practitioners (CPA, attorney, EA, CFP). Track CE hours and reporting deadlines for each licensed staff member.",
      deadline_type: "employee_cert",
      governing_agency: `${data.state} Professional Licensing Board`,
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
      severity_tier: "high",
      penalty_estimate_cents: 50000,
    });
  }

  return deadlines;
}
