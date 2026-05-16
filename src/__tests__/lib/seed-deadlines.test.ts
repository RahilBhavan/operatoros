import { describe, it, expect } from "vitest";
import { buildStarterDeadlines } from "@/lib/seed-deadlines";
import type { OnboardingData } from "@/types/onboarding";

// Fixed reference date: 2026-01-15 (mid-January, all quarter dates predictable)
const REF = new Date(2026, 0, 15);
const BIZ = "biz-test-id";

function build(data: Partial<OnboardingData>) {
  const defaults: OnboardingData = {
    businessName: "Test Business",
    industry: null,
    state: "TX",
    entityType: "llc",
    employeeRange: "1",
    hiresContractors: false,
  };
  return buildStarterDeadlines({ ...defaults, ...data }, BIZ, REF);
}

function names(deadlines: ReturnType<typeof build>) {
  return deadlines.map((d) => d.name);
}

function agencies(deadlines: ReturnType<typeof build>) {
  return deadlines.map((d) => d.governing_agency);
}

// ─── Combo 1: California LLC Restaurant (6-15 employees) ──────────────────
describe("CA LLC restaurant — 6-15 employees", () => {
  const deadlines = build({
    state: "CA",
    entityType: "llc",
    industry: "restaurant",
    employeeRange: "6-15",
    hiresContractors: false,
  });

  it("includes California $800 minimum franchise tax", () => {
    expect(names(deadlines)).toContain("California Minimum Franchise Tax ($800)");
    const ftb = deadlines.find((d) => d.name === "California Minimum Franchise Tax ($800)")!;
    expect(ftb.governing_agency).toBe("California Franchise Tax Board (FTB)");
    expect(ftb.deadline_type).toBe("tax_filing");
  });

  it("includes CA LLC Statement of Information", () => {
    expect(names(deadlines)).toContain("CA LLC Statement of Information");
  });

  it("includes CA SDI/payroll registration for 6+ employees", () => {
    expect(names(deadlines)).toContain("California SDI / Payroll Tax Registration");
    const sdi = deadlines.find((d) => d.name === "California SDI / Payroll Tax Registration")!;
    expect(sdi.governing_agency).toBe("California EDD");
  });

  it("includes food service health permit", () => {
    expect(names(deadlines)).toContain("Food Service / Health Permit Renewal");
    const permit = deadlines.find((d) => d.name === "Food Service / Health Permit Renewal")!;
    expect(permit.governing_agency).toBe("County Health Department");
  });

  it("includes CA state sales tax for restaurants", () => {
    const salesTax = deadlines.find((d) => d.name === "State Sales Tax Filing — Monthly")!;
    expect(salesTax).toBeDefined();
    expect(salesTax.governing_agency).toContain("CA");
  });

  it("includes food handler certifications", () => {
    expect(names(deadlines)).toContain("Food Handler Certifications (Staff)");
  });

  it("includes OSHA 300 log for 6+ employees", () => {
    expect(names(deadlines)).toContain("OSHA 300 Log — Annual Summary Posting");
    const osha = deadlines.find((d) => d.name === "OSHA 300 Log — Annual Summary Posting")!;
    expect(osha.governing_agency).toBe("OSHA (Federal / State)");
  });

  it("includes quarterly 941 payroll tax (2 upcoming)", () => {
    const filing941 = deadlines.filter((d) =>
      d.name === "Quarterly Payroll Tax Filing (Form 941)"
    );
    expect(filing941.length).toBe(2);
  });

  it("includes FUTA 940 annual return", () => {
    expect(names(deadlines)).toContain("Annual FUTA Tax Return (Form 940)");
  });

  it("covers at least 12 unique obligations", () => {
    expect(deadlines.length).toBeGreaterThanOrEqual(12);
  });

  it("all deadlines have required fields", () => {
    for (const d of deadlines) {
      expect(d.name).toBeTruthy();
      expect(d.description).toBeTruthy();
      expect(d.deadline_type).toBeTruthy();
      expect(d.governing_agency).toBeTruthy();
      expect(d.due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(d.business_id).toBe(BIZ);
      expect(d.source).toBe("discovery_agent");
    }
  });
});

// ─── Combo 2: Texas S-Corp Construction (2-5 employees, hires contractors) ──
describe("TX S-Corp construction — 2-5 employees, hires contractors", () => {
  const deadlines = build({
    state: "TX",
    entityType: "s_corp",
    industry: "construction",
    employeeRange: "2-5",
    hiresContractors: true,
  });

  it("includes Texas franchise tax", () => {
    expect(names(deadlines)).toContain("Texas Franchise Tax Report");
    const tx = deadlines.find((d) => d.name === "Texas Franchise Tax Report")!;
    expect(tx.governing_agency).toBe("Texas Comptroller of Public Accounts");
    expect(tx.due_date).toBe("2026-05-15");
  });

  it("includes TX annual entity filing", () => {
    expect(names(deadlines)).toContain("TX Annual Report / Entity Filing");
  });

  it("includes contractor license renewal", () => {
    expect(names(deadlines)).toContain("Contractor License Renewal");
    const lic = deadlines.find((d) => d.name === "Contractor License Renewal")!;
    expect(lic.governing_agency).toContain("TX");
  });

  it("includes subcontractor COI renewals for contractor-hiring businesses", () => {
    expect(names(deadlines)).toContain("Subcontractor COI Renewals");
  });

  it("includes 1099-NEC for contractor-hiring businesses", () => {
    expect(names(deadlines)).toContain("1099-NEC Filing for Contractors");
  });

  it("includes S-Corp federal tax return (Form 1120-S, due March 15)", () => {
    const ret = deadlines.find((d) =>
      d.name === "Federal Business Tax Return (Form 1120-S / 1065)"
    )!;
    expect(ret).toBeDefined();
    expect(ret.due_date).toBe("2026-03-15");
  });

  it("includes workers comp for employees", () => {
    expect(names(deadlines)).toContain("Workers' Compensation Insurance Renewal");
  });

  it("does NOT include OSHA 300 for fewer than 6 employees", () => {
    expect(names(deadlines)).not.toContain("OSHA 300 Log — Annual Summary Posting");
  });
});

// ─── Combo 3: New York Sole Proprietor Healthcare (no employees) ─────────────
describe("NY sole proprietor healthcare — no employees", () => {
  const deadlines = build({
    state: "NY",
    entityType: "sole_proprietor",
    industry: "healthcare",
    employeeRange: "1",
    hiresContractors: false,
  });

  it("includes professional license renewals", () => {
    expect(names(deadlines)).toContain("Professional License Renewals");
    const lic = deadlines.find((d) => d.name === "Professional License Renewals")!;
    expect(lic.governing_agency).toContain("NY");
  });

  it("includes HIPAA security risk assessment", () => {
    expect(names(deadlines)).toContain("HIPAA Security Risk Assessment");
    const hipaa = deadlines.find((d) => d.name === "HIPAA Security Risk Assessment")!;
    expect(hipaa.governing_agency).toBe("HHS / OCR");
  });

  it("includes DEA registration renewal for healthcare", () => {
    expect(names(deadlines)).toContain("DEA Registration Renewal");
  });

  it("does NOT include NY entity filing for sole proprietor", () => {
    // Sole proprietors don't file entity-level state reports
    const nyBiennial = deadlines.filter(
      (d) =>
        d.name.includes("Biennial Statement") ||
        d.name.includes("Annual Report / Entity Filing")
    );
    expect(nyBiennial.length).toBe(0);
  });

  it("includes quarterly estimated taxes for sole proprietor", () => {
    const estTax = deadlines.filter((d) =>
      d.name.startsWith("Federal Estimated Tax Payment")
    );
    expect(estTax.length).toBeGreaterThanOrEqual(1);
  });

  it("does NOT include 941/FUTA for no-employee business", () => {
    expect(names(deadlines)).not.toContain("Quarterly Payroll Tax Filing (Form 941)");
    expect(names(deadlines)).not.toContain("Annual FUTA Tax Return (Form 940)");
  });
});

// ─── Combo 4: Florida C-Corp Retail (1 employee) ─────────────────────────────
describe("FL C-Corp retail — 1 employee (owner only)", () => {
  const deadlines = build({
    state: "FL",
    entityType: "c_corp",
    industry: "retail",
    employeeRange: "1",
    hiresContractors: false,
  });

  it("includes Florida annual report (due May 1)", () => {
    expect(names(deadlines)).toContain("Florida Annual Report");
    const fl = deadlines.find((d) => d.name === "Florida Annual Report")!;
    expect(fl.due_date).toBe("2026-05-01");
    expect(fl.governing_agency).toBe("Florida Division of Corporations (Sunbiz)");
  });

  it("includes FL entity filing (from generic state block)", () => {
    expect(names(deadlines)).toContain("FL Annual Report / Entity Filing");
  });

  it("includes state sales tax for retail", () => {
    expect(names(deadlines)).toContain("State Sales Tax Filing");
    const tax = deadlines.find((d) => d.name === "State Sales Tax Filing")!;
    expect(tax.governing_agency).toContain("FL");
  });

  it("includes seller's permit renewal for retail", () => {
    expect(names(deadlines)).toContain("Seller's Permit / Retail License Renewal");
  });

  it("includes C-Corp federal tax return (Form 1120, due April 15)", () => {
    const ret = deadlines.find(
      (d) => d.name === "Federal Corporate Tax Return (Form 1120)"
    )!;
    expect(ret).toBeDefined();
    expect(ret.due_date).toBe("2026-04-15");
  });

  it("does NOT include quarterly estimated taxes for C-Corp", () => {
    const estTax = deadlines.filter((d) =>
      d.name.startsWith("Federal Estimated Tax Payment")
    );
    expect(estTax.length).toBe(0);
  });
});

// ─── Combo 5: Delaware LLC — no employees, no industry ────────────────────────
describe("DE LLC — no employees, no specific industry", () => {
  const deadlines = build({
    state: "DE",
    entityType: "llc",
    industry: "other",
    employeeRange: "1",
    hiresContractors: false,
  });

  it("includes Delaware LLC annual tax (due June 1, $300)", () => {
    expect(names(deadlines)).toContain("Delaware LLC Annual Tax");
    const de = deadlines.find((d) => d.name === "Delaware LLC Annual Tax")!;
    expect(de.due_date).toBe("2026-06-01");
    expect(de.governing_agency).toBe("Delaware Division of Corporations");
    expect(de.description).toContain("$300");
  });

  it("includes DE annual entity filing", () => {
    expect(names(deadlines)).toContain("DE Annual Report / Entity Filing");
  });

  it("does NOT include payroll obligations for solo LLC", () => {
    expect(names(deadlines)).not.toContain("Quarterly Payroll Tax Filing (Form 941)");
    expect(names(deadlines)).not.toContain("Annual FUTA Tax Return (Form 940)");
    expect(names(deadlines)).not.toContain("Workers' Compensation Insurance Renewal");
  });

  it("includes individual federal income tax return", () => {
    expect(names(deadlines)).toContain(
      "Federal Income Tax Return (Schedule C / 1040)"
    );
  });

  it("has no duplicate deadline names", () => {
    const ns = names(deadlines);
    const unique = new Set(ns);
    expect(unique.size).toBe(ns.length);
  });
});

// ─── Combo 6: NY LLC — Construction (31-50 employees, hires contractors) ──────
describe("NY LLC construction — 31-50 employees, hires contractors", () => {
  const deadlines = build({
    state: "NY",
    entityType: "llc",
    industry: "construction",
    employeeRange: "31-50",
    hiresContractors: true,
  });

  it("includes NY LLC biennial statement", () => {
    expect(names(deadlines)).toContain("New York LLC Biennial Statement");
    const ny = deadlines.find((d) => d.name === "New York LLC Biennial Statement")!;
    expect(ny.governing_agency).toBe("New York Department of State");
  });

  it("includes contractor license renewal", () => {
    expect(names(deadlines)).toContain("Contractor License Renewal");
  });

  it("includes OSHA 300 log for 31-50 employees", () => {
    expect(names(deadlines)).toContain("OSHA 300 Log — Annual Summary Posting");
  });

  it("includes 2 quarterly 941 filings", () => {
    const filings = deadlines.filter((d) =>
      d.name === "Quarterly Payroll Tax Filing (Form 941)"
    );
    expect(filings.length).toBe(2);
  });

  it("includes subcontractor COI renewals", () => {
    expect(names(deadlines)).toContain("Subcontractor COI Renewals");
  });

  it("covers at least 10 unique obligations for large construction LLC", () => {
    expect(deadlines.length).toBeGreaterThanOrEqual(10);
  });
});

// ─── Severity metadata + source URLs (moat upgrade) ──────────────────────────
describe("severity + sourcing metadata", () => {
  const deadlines = build({
    state: "CA",
    entityType: "llc",
    industry: "restaurant",
    employeeRange: "6-15",
    hiresContractors: false,
  });

  it("CA Minimum Franchise Tax is critical severity with source URL and statute", () => {
    const d = deadlines.find((d) => d.name === "California Minimum Franchise Tax ($800)")!;
    expect(d.severity_tier).toBe("critical");
    expect(d.source_url).toMatch(/ftb\.ca\.gov/);
    expect(d.statute_citation).toMatch(/§17941/);
    expect(d.penalty_estimate_cents).toBe(80000);
  });

  it("Form 941 quarterly payroll is critical severity", () => {
    const d = deadlines.find((d) => d.name === "Quarterly Payroll Tax Filing (Form 941)")!;
    expect(d.severity_tier).toBe("critical");
    expect(d.source_url).toMatch(/irs\.gov/);
  });

  it("Food service health permit is critical with non-null penalty", () => {
    const d = deadlines.find((d) => d.name === "Food Service / Health Permit Renewal")!;
    expect(d.severity_tier).toBe("critical");
    expect(d.penalty_estimate_cents).not.toBeNull();
  });

  it("every seeded deadline has a defined severity_tier", () => {
    for (const d of deadlines) {
      expect(d.severity_tier).toBeDefined();
      expect(["critical", "high", "medium", "low", "info"]).toContain(d.severity_tier);
    }
  });
});

// ─── 50-state fallback coverage ──────────────────────────────────────────────
describe("50-state fallback rule table", () => {
  it("MO LLC gets a Missouri-specific entity report", () => {
    const ds = build({ state: "MO", entityType: "llc", industry: "other", employeeRange: "1" });
    const moEntity = ds.find((d) => d.governing_agency?.startsWith("Missouri"));
    expect(moEntity).toBeDefined();
  });

  it("WA C-Corp gets a Washington-specific entity report", () => {
    const ds = build({ state: "WA", entityType: "c_corp", industry: "other", employeeRange: "1" });
    const wa = ds.find((d) => d.governing_agency?.includes("Washington"));
    expect(wa).toBeDefined();
  });

  it("DC LLC gets DC-specific entity coverage", () => {
    const ds = build({ state: "DC", entityType: "llc", industry: "other", employeeRange: "1" });
    expect(ds.some((d) => d.governing_agency?.includes("DC"))).toBe(true);
  });

  it("Sole proprietors do not get the fallback entity report (no entity to file)", () => {
    const ds = build({
      state: "MO",
      entityType: "sole_proprietor",
      industry: "other",
      employeeRange: "1",
    });
    const moEntity = ds.find((d) => d.governing_agency?.startsWith("Missouri"));
    expect(moEntity).toBeUndefined();
  });
});

// ─── Cross-cutting: all due dates are valid future dates ──────────────────────
describe("due date validity", () => {
  const combos: OnboardingData[] = [
    { businessName: "A", state: "CA", entityType: "llc", industry: "restaurant", employeeRange: "6-15", hiresContractors: false },
    { businessName: "B", state: "TX", entityType: "s_corp", industry: "construction", employeeRange: "2-5", hiresContractors: true },
    { businessName: "C", state: "NY", entityType: "sole_proprietor", industry: "healthcare", employeeRange: "1", hiresContractors: false },
    { businessName: "D", state: "FL", entityType: "c_corp", industry: "retail", employeeRange: "1", hiresContractors: false },
    { businessName: "E", state: "DE", entityType: "llc", industry: "other", employeeRange: "1", hiresContractors: false },
    { businessName: "F", state: "NY", entityType: "llc", industry: "construction", employeeRange: "31-50", hiresContractors: true },
  ];

  for (const data of combos) {
    it(`${data.state} ${data.entityType} ${data.industry}: all due_dates are after reference date`, () => {
      const ds = buildStarterDeadlines(data, BIZ, REF);
      for (const d of ds) {
        const due = new Date(d.due_date);
        expect(due.getTime()).toBeGreaterThan(REF.getTime());
      }
    });
  }
});
