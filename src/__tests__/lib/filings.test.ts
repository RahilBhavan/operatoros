import { describe, it, expect, afterEach } from "vitest";
import {
  FILING_CATALOG,
  isFilingsConfigured,
  matchFilingKind,
} from "@/lib/filings";

describe("filings catalog", () => {
  it("has the six advertised filing kinds with non-zero prices", () => {
    const kinds = Object.keys(FILING_CATALOG);
    expect(kinds).toEqual(
      expect.arrayContaining([
        "state_annual_report",
        "fincen_boi",
        "de_franchise_tax",
        "business_license_renewal",
        "food_handler",
        "liquor_renewal",
      ])
    );
    for (const k of kinds) {
      const def = FILING_CATALOG[k as keyof typeof FILING_CATALOG];
      expect(def.priceCents).toBeGreaterThan(0);
      expect(def.label.length).toBeGreaterThan(0);
    }
  });

  it("every kind ships with a non-empty description", () => {
    for (const def of Object.values(FILING_CATALOG)) {
      expect(def.description.length).toBeGreaterThan(0);
    }
  });
});

describe("matchFilingKind heuristic", () => {
  it("recognises FinCEN BOI by name", () => {
    expect(
      matchFilingKind({
        deadlineName: "FinCEN BOI Report",
        agency: "FinCEN",
      })
    ).toBe("fincen_boi");
  });

  it("recognises DE franchise tax only when both terms are present", () => {
    expect(
      matchFilingKind({
        deadlineName: "Franchise tax filing",
        agency: "Delaware Division of Corporations",
      })
    ).toBe("de_franchise_tax");
    expect(
      matchFilingKind({
        deadlineName: "Franchise tax",
        agency: "CA Franchise Tax Board",
      })
    ).toBe(null);
  });

  it("matches state annual report flavours", () => {
    expect(
      matchFilingKind({
        deadlineName: "Annual Report",
        agency: "Secretary of State",
      })
    ).toBe("state_annual_report");
    expect(
      matchFilingKind({
        deadlineName: "Statement of Information",
        agency: "California SoS",
      })
    ).toBe("state_annual_report");
  });

  it("returns null when nothing fits", () => {
    expect(
      matchFilingKind({
        deadlineName: "Random thing",
        agency: "Some agency",
      })
    ).toBe(null);
  });
});

describe("isFilingsConfigured", () => {
  const originalHarbor = process.env.HARBOR_COMPLIANCE_API_KEY;
  const originalLogix = process.env.LICENSE_LOGIX_API_KEY;

  afterEach(() => {
    process.env.HARBOR_COMPLIANCE_API_KEY = originalHarbor;
    process.env.LICENSE_LOGIX_API_KEY = originalLogix;
  });

  it("returns false when neither partner key is set", () => {
    delete process.env.HARBOR_COMPLIANCE_API_KEY;
    delete process.env.LICENSE_LOGIX_API_KEY;
    expect(isFilingsConfigured()).toBe(false);
  });

  it("returns true when either partner key is set", () => {
    delete process.env.HARBOR_COMPLIANCE_API_KEY;
    process.env.LICENSE_LOGIX_API_KEY = "lk_test";
    expect(isFilingsConfigured()).toBe(true);
    process.env.HARBOR_COMPLIANCE_API_KEY = "hc_test";
    delete process.env.LICENSE_LOGIX_API_KEY;
    expect(isFilingsConfigured()).toBe(true);
  });
});
