import type { OnboardingData } from "@/types/onboarding";
import { formatIsoDate } from "@/lib/deadline-utils";
import { requiresOshaLog } from "@/lib/onboarding-utils";

export type DeadlineSeed = {
  business_id: string;
  name: string;
  description: string;
  deadline_type: string;
  governing_agency: string;
  frequency: string;
  due_date: string;
  source: string;
};

// Returns the next future date for a given month (0-indexed) and day.
export function nextDate(month: number, day: number, referenceDate?: Date): Date {
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(today.getFullYear(), month, day);
  if (candidate <= today) candidate.setFullYear(candidate.getFullYear() + 1);
  return candidate;
}

// Returns the next N quarterly 941 due dates (Apr 30, Jul 31, Oct 31, Jan 31).
export function next941Dates(n: number, referenceDate?: Date): Date[] {
  const quarterEnds = [
    [3, 30], // Q1 → April 30
    [6, 31], // Q2 → July 31
    [9, 31], // Q3 → October 31
    [0, 31], // Q4 → January 31
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

// State-specific deadline builders. Each returns zero or more seeds to append.
function stateDeadlines(
  data: OnboardingData,
  businessId: string,
  today: Date,
  nd: (month: number, day: number) => Date
): Omit<DeadlineSeed, "business_id" | "source">[] {
  const { state, entityType } = data;
  const out: Omit<DeadlineSeed, "business_id" | "source">[] = [];

  // California — LLC minimum franchise tax + Statement of Information
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
      });
    }
  }

  // Texas — Franchise tax (due May 15)
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
      });
    }
  }

  // New York — Biennial Statement + NYC Business Certificate
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
      });
    }
  }

  // Delaware — Annual Franchise Tax (due March 1)
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
      });
    }
  }

  // Florida — Annual Report (due May 1)
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
      });
    }
  }

  return out;
}

/**
 * Builds the starter set of compliance deadlines for a new business.
 * Pure function — no side effects, no network calls.
 * Accepts an optional referenceDate for deterministic testing.
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

  function push(d: Omit<DeadlineSeed, "business_id" | "source">) {
    deadlines.push({ ...d, business_id: businessId, source: "discovery_agent" });
  }

  function nd(month: number, day: number): Date {
    return nextDate(month, day, today);
  }

  // ── Entity filing ──────────────────────────────────────────────────────────
  if (data.entityType && ["llc", "s_corp", "c_corp"].includes(data.entityType)) {
    push({
      name: `${data.state} Annual Report / Entity Filing`,
      description: `Annual state entity report for ${data.entityType.toUpperCase()} in ${data.state}. Failure to file can result in administrative dissolution.`,
      deadline_type: "entity_filing",
      governing_agency: `${data.state} Secretary of State`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
    });
  }

  // ── Business license ───────────────────────────────────────────────────────
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
  });

  // ── Federal income tax return ──────────────────────────────────────────────
  if (data.entityType === "s_corp" || data.entityType === "partnership") {
    push({
      name: "Federal Business Tax Return (Form 1120-S / 1065)",
      description:
        "S-Corp and partnership federal income tax return due March 15. File Form 7004 for a 6-month extension.",
      deadline_type: "tax_filing",
      governing_agency: "IRS",
      frequency: "annual",
      due_date: formatIsoDate(nd(2, 15)),
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
    });
  } else {
    push({
      name: "Federal Income Tax Return (Schedule C / 1040)",
      description: "Individual federal income tax return including business income. Due April 15.",
      deadline_type: "tax_filing",
      governing_agency: "IRS",
      frequency: "annual",
      due_date: formatIsoDate(nd(3, 15)),
    });
  }

  // ── Quarterly estimated taxes (non-withheld income) ────────────────────────
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
        });
      }
    }
  }

  // ── Payroll tax deadlines (businesses with employees) ─────────────────────
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
    });

    push({
      name: "W-2 / 1099 Filing Deadline",
      description:
        "File W-2s with SSA and distribute to employees by January 31. File 1099-NEC forms for contractors paid $600+.",
      deadline_type: "tax_filing",
      governing_agency: "IRS / SSA",
      frequency: "annual",
      due_date: formatIsoDate(nd(0, 31)),
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
    });
  }

  // ── OSHA 300 Log (6+ employees) ───────────────────────────────────────────
  if (requiresOshaLog(data.employeeRange)) {
    push({
      name: "OSHA 300 Log — Annual Summary Posting",
      description:
        "Post the OSHA 300A annual summary of work-related injuries and illnesses from Feb 1 – Apr 30.",
      deadline_type: "equipment_inspection",
      governing_agency: "OSHA (Federal / State)",
      frequency: "annual",
      due_date: formatIsoDate(new Date(today.getFullYear() + 1, 1, 1)),
    });
  }

  // ── 1099-NEC (contractor-hiring businesses) ───────────────────────────────
  if (data.hiresContractors) {
    push({
      name: "1099-NEC Filing for Contractors",
      description:
        "File 1099-NEC forms with the IRS and send copies to all contractors paid $600+ during the year. Due January 31.",
      deadline_type: "tax_filing",
      governing_agency: "IRS",
      frequency: "annual",
      due_date: formatIsoDate(nd(0, 31)),
    });
  }

  // ── State-specific deadlines ──────────────────────────────────────────────
  for (const d of stateDeadlines(data, businessId, today, nd)) {
    deadlines.push({ ...d, business_id: businessId, source: "discovery_agent" });
  }

  // ── Industry: Restaurant ──────────────────────────────────────────────────
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
    });
    push({
      name: "Food Handler Certifications (Staff)",
      description:
        "Track expiry for all food handler cards / ServSafe certifications for front-of-house and kitchen staff.",
      deadline_type: "employee_cert",
      governing_agency: "State Health Department",
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
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
    });
  }

  // ── Industry: Construction ────────────────────────────────────────────────
  if (data.industry === "construction") {
    push({
      name: "Contractor License Renewal",
      description:
        "State contractor license renewal. Required to legally bid and perform work.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Contractors Licensing Board`,
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
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
      });
    }
  }

  // ── Industry: Healthcare ──────────────────────────────────────────────────
  if (data.industry === "healthcare") {
    push({
      name: "Professional License Renewals",
      description:
        "Track all staff professional license renewals (RN, MD, PT, etc.) and continuing education requirements.",
      deadline_type: "employee_cert",
      governing_agency: `${data.state} Professional Licensing Board`,
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
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
    });
    push({
      name: "HIPAA Security Risk Assessment",
      description:
        "Annual HIPAA Security Rule risk analysis required for all covered entities and business associates. Document findings and remediation plan.",
      deadline_type: "equipment_inspection",
      governing_agency: "HHS / OCR",
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
    });
  }

  // ── Industry: Retail ──────────────────────────────────────────────────────
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
    });
    push({
      name: "Seller's Permit / Retail License Renewal",
      description:
        "State retail seller's permit renewal. Required to collect and remit sales tax. Verify renewal period with your state.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Department of Revenue`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
    });
  }

  // ── Industry: Personal Services ───────────────────────────────────────────
  if (data.industry === "personal_services") {
    push({
      name: "Cosmetology / Trade License Renewal",
      description:
        "State professional board license renewal for barbers, cosmetologists, estheticians, and nail technicians. Required for all licensed staff.",
      deadline_type: "employee_cert",
      governing_agency: `${data.state} Board of Cosmetology`,
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
    });
    push({
      name: "Establishment License Renewal",
      description:
        "State facility license for salon, spa, or personal service establishment. Separate from individual staff licenses.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Board of Cosmetology / Health`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
    });
  }

  // ── Industry: Fitness / Wellness ──────────────────────────────────────────
  if (data.industry === "fitness") {
    push({
      name: "Fitness Facility License Renewal",
      description:
        "State fitness facility registration or health club license. Required in most states; protects members under consumer protection laws.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Department of Consumer Affairs`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
    });
    push({
      name: "Personal Trainer / Instructor Certifications",
      description:
        "Track expiry for staff CPT, group fitness, and CPR/AED certifications. Many states require proof of certification for insurance compliance.",
      deadline_type: "employee_cert",
      governing_agency: "NASM / ACE / NSCA",
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
    });
  }

  // ── Industry: Transportation / Logistics ──────────────────────────────────
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
    });
    push({
      name: "Commercial Vehicle Registration Renewal",
      description:
        "Annual registration renewal for all commercial vehicles. Verify deadlines per vehicle with your state DMV.",
      deadline_type: "business_license",
      governing_agency: `${data.state} DMV / DOT`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
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
      });
    }
  }

  // ── Industry: Manufacturing ───────────────────────────────────────────────
  if (data.industry === "manufacturing") {
    push({
      name: "EPA Hazardous Waste Annual Report",
      description:
        "Large-quantity generators must submit an annual hazardous waste report to the EPA by March 1. Small-quantity generators may have reporting obligations.",
      deadline_type: "equipment_inspection",
      governing_agency: "EPA",
      frequency: "annual",
      due_date: formatIsoDate(nd(2, 1)),
    });
    push({
      name: "Air Permit / Emissions Reporting",
      description:
        "Annual air quality permit renewal and emissions inventory report. Timing varies by state and permit class. Verify with your state environmental agency.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Environmental Agency`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
    });
  }

  return deadlines;
}
