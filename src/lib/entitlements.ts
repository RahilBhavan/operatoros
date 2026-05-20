/**
 * Central entitlements matrix. WS-0.3 introduces a "lite" tier alongside the
 * existing "free", "business", and "accountant" tiers — Lite gates AI,
 * accountant portal, share link, and document storage above 1 GB.
 *
 * The Lite tier is wired in code but does not yet have:
 *   1. A Stripe price ID (must be created in the Stripe dashboard).
 *   2. A DB enum / check-constraint update to accept "lite" as a value.
 *      Once added, narrow the cast in `planTier()` below.
 *
 * Until both land, the pricing page surfaces Lite as "Coming soon" and no
 * customer can land on it. Existing Business customers are grandfathered.
 */

export type PlanTier = "free" | "lite" | "business" | "accountant";

export interface Entitlements {
  /** Can use AI compliance insights. */
  ai: boolean;
  /** Can invite an accountant (accountant_connections). */
  accountantPortal: boolean;
  /** Can mint a public share link. */
  shareLink: boolean;
  /** Document storage cap in MiB. */
  storageCapMib: number;
  /** Can invite team members. */
  teamInvites: boolean;
  /** Maximum active team members (incl. owner). Surfaced in /billing usage. */
  teamMemberMax: number;
  /** Marketing-facing label for UI. */
  label: string;
}

const MATRIX: Record<PlanTier, Entitlements> = {
  free: {
    ai: false,
    accountantPortal: false,
    shareLink: false,
    storageCapMib: 100,
    teamInvites: false,
    teamMemberMax: 1,
    label: "Free trial",
  },
  lite: {
    ai: false,
    accountantPortal: false,
    shareLink: false,
    storageCapMib: 1024,
    teamInvites: false,
    teamMemberMax: 1,
    label: "Lite",
  },
  business: {
    ai: true,
    accountantPortal: true,
    shareLink: true,
    storageCapMib: 10 * 1024,
    teamInvites: true,
    teamMemberMax: 5,
    label: "Business",
  },
  accountant: {
    ai: true,
    accountantPortal: true,
    shareLink: true,
    storageCapMib: 50 * 1024,
    teamInvites: true,
    teamMemberMax: 25,
    label: "Accountant",
  },
};

/** Narrow an arbitrary DB-loaded plan_tier string to a known PlanTier. */
export function planTier(raw: string | null | undefined): PlanTier {
  if (raw === "lite" || raw === "business" || raw === "accountant") {
    return raw;
  }
  return "free";
}

export function entitlementsFor(raw: string | null | undefined): Entitlements {
  return MATRIX[planTier(raw)];
}

/** Convenience: paid tiers that include the share/portal/AI bundle. */
export function isPaidWithFullFeatures(
  raw: string | null | undefined,
  billingStatus: string | null | undefined
): boolean {
  const ents = entitlementsFor(raw);
  const billingOk = billingStatus === "active" || billingStatus === "trialing";
  return billingOk && ents.ai && ents.shareLink;
}

/**
 * Industries the buyer panel flagged as "thin compliance" — operators who
 * found $79 too high because their surface is genuinely small. WS-1.5 uses
 * this list to suggest Lite at onboarding.
 *
 * Panel source: photographer (#93), storage facility (#79), vintage shop
 * (#64), solo food truck (#2), Vermont B&B (#10), septic (#40), family farm
 * (#100). NAICS slugs that mostly map: personal_services (solo), retail
 * (single-product specialty), "other".
 */
const THIN_COMPLIANCE_INDUSTRIES = new Set([
  "personal_services",
  "retail",
  "other",
  "fitness",
]);

/**
 * Lite suggestion gate: solo or near-solo operators in thin-compliance
 * industries. Returns true when both conditions hold.
 */
export function shouldSuggestLite(
  industrySlug: string | null | undefined,
  employeeCount: number | null | undefined
): boolean {
  if (!industrySlug) return false;
  if (employeeCount == null) return false;
  // Numeric mapping: "1" → 1, "2-5" → 3 (see onboarding-utils.ts).
  // Threshold of 3 captures both the "Just me" and "2-5 micro team" buckets.
  if (employeeCount > 3) return false;
  return THIN_COMPLIANCE_INDUSTRIES.has(industrySlug);
}

