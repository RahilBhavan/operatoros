/**
 * WS-4.1 — Filing-as-a-service pricing + eligibility matrix. Reads
 * publicly-known per-filing prices that a partner (Harbor Compliance or
 * LicenseLogix) charges, plus the OS-side margin. Until the partner
 * agreement lands, `isFilingsConfigured()` returns false and the UI
 * surfaces "coming soon" instead of routing to a paid checkout.
 */

export type FilingKind =
  | "state_annual_report"
  | "fincen_boi"
  | "de_franchise_tax"
  | "business_license_renewal"
  | "food_handler"
  | "liquor_renewal";

export interface FilingDef {
  kind: FilingKind;
  label: string;
  priceCents: number;
  description: string;
}

export const FILING_CATALOG: Record<FilingKind, FilingDef> = {
  state_annual_report: {
    kind: "state_annual_report",
    label: "State annual report",
    priceCents: 14900,
    description:
      "Operator OS prepares + files your state annual report with the Secretary of State. State filing fee passed through; service fee included.",
  },
  fincen_boi: {
    kind: "fincen_boi",
    label: "FinCEN Beneficial Ownership report",
    priceCents: 12900,
    description:
      "We file the FinCEN BOI report on your behalf. Required for most LLCs/corporations formed before 2024.",
  },
  de_franchise_tax: {
    kind: "de_franchise_tax",
    label: "Delaware franchise tax",
    priceCents: 9900,
    description:
      "Annual Delaware franchise tax filing for DE-formed entities. Tax due is passed through at cost.",
  },
  business_license_renewal: {
    kind: "business_license_renewal",
    label: "Business license renewal",
    priceCents: 12900,
    description: "We handle the paperwork for your city/county business license renewal.",
  },
  food_handler: {
    kind: "food_handler",
    label: "Food handler renewal (state-permitted)",
    priceCents: 7900,
    description:
      "Re-issue a state food handler certificate where the state permits online renewal.",
  },
  liquor_renewal: {
    kind: "liquor_renewal",
    label: "Liquor license renewal (state-permitted)",
    priceCents: 24900,
    description:
      "Re-issue a state liquor license renewal where the state permits online renewal.",
  },
};

export function isFilingsConfigured(): boolean {
  // Either partner API key unlocks the path. Either is fine — the partner
  // routing layer decides which to use per filing_kind + jurisdiction.
  return Boolean(
    process.env.HARBOR_COMPLIANCE_API_KEY ||
      process.env.LICENSE_LOGIX_API_KEY
  );
}

/**
 * Heuristic mapping: given a deadline's name + agency, which filing
 * catalog entry (if any) is the most likely "file this for me" candidate?
 * Returns null if no confident match.
 */
export function matchFilingKind(args: {
  deadlineName: string | null;
  agency: string | null;
}): FilingKind | null {
  const haystack = `${args.deadlineName ?? ""} ${args.agency ?? ""}`.toLowerCase();
  if (haystack.includes("fincen") || haystack.includes("beneficial ownership")) {
    return "fincen_boi";
  }
  if (haystack.includes("franchise tax") && haystack.includes("delaware")) {
    return "de_franchise_tax";
  }
  if (
    haystack.includes("annual report") ||
    haystack.includes("annual registration") ||
    haystack.includes("statement of information")
  ) {
    return "state_annual_report";
  }
  if (haystack.includes("food handler")) return "food_handler";
  if (haystack.includes("liquor")) return "liquor_renewal";
  if (haystack.includes("business license")) return "business_license_renewal";
  return null;
}
