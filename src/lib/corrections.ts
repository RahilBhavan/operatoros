// Shared shapes + validators for the rule_corrections loop.
//
// The accountant API route, the admin review route, and the UI all need
// the same field-by-field validation. Centralised here so they can't drift.

const STRING_FIELDS = [
  "name",
  "description",
  "deadline_type",
  "governing_agency",
  "frequency",
  "source_url",
  "statute_citation",
] as const;

const SEVERITY_VALUES = ["critical", "high", "medium", "low", "info"] as const;
const FREQUENCY_VALUES = [
  "quarterly",
  "annual",
  "monthly",
  "one_time",
  "event_driven",
  "biennial",
  "semiannual",
] as const;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ProposedChanges = Record<string, unknown>;

export type ValidationResult =
  | { ok: true; value: ProposedChanges }
  | { ok: false; error: string };

// Mirrors the shape that version_regulatory_rule reads — keep these in
// sync with the SQL function so any field accepted here is honoured on
// accept. (The admin /api/admin/rules/[id]/edit route uses the same
// validator under a different name; the rules there are the same.)
export function validateProposedChanges(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "proposed_changes must be an object" };
  }
  const obj = raw as Record<string, unknown>;
  const out: ProposedChanges = {};

  for (const f of STRING_FIELDS) {
    if (!(f in obj)) continue;
    const v = obj[f];
    if (v === null || v === "") {
      if (f === "source_url" || f === "statute_citation") {
        out[f] = "";
        continue;
      }
      return { ok: false, error: `${f} cannot be empty` };
    }
    if (typeof v !== "string") return { ok: false, error: `${f} must be a string` };
    if (v.length > 2000) return { ok: false, error: `${f} too long` };
    if (f === "frequency" && !FREQUENCY_VALUES.includes(v as (typeof FREQUENCY_VALUES)[number])) {
      return { ok: false, error: "Invalid frequency" };
    }
    out[f] = v;
  }

  if ("severity_tier" in obj) {
    const v = obj.severity_tier;
    if (
      typeof v !== "string" ||
      !SEVERITY_VALUES.includes(v as (typeof SEVERITY_VALUES)[number])
    ) {
      return { ok: false, error: "Invalid severity_tier" };
    }
    out.severity_tier = v;
  }

  if ("penalty_estimate_cents" in obj) {
    const v = obj.penalty_estimate_cents;
    if (v === null || v === "") {
      out.penalty_estimate_cents = "";
    } else {
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        return {
          ok: false,
          error: "penalty_estimate_cents must be a non-negative integer",
        };
      }
      out.penalty_estimate_cents = String(n);
    }
  }

  for (const f of ["effective_date", "sunset_date"] as const) {
    if (!(f in obj)) continue;
    const v = obj[f];
    if (v === null || v === "") {
      if (f === "sunset_date") {
        out.sunset_date = "";
        continue;
      }
      return { ok: false, error: `${f} cannot be empty` };
    }
    if (typeof v !== "string" || !ISO_DATE_RE.test(v)) {
      return { ok: false, error: `${f} must be YYYY-MM-DD` };
    }
    out[f] = v;
  }

  for (const f of ["due_date_rule", "applies_when"] as const) {
    if (!(f in obj)) continue;
    const v = obj[f];
    if (!v || typeof v !== "object" || Array.isArray(v)) {
      return { ok: false, error: `${f} must be an object` };
    }
    out[f] = v;
  }

  if (Object.keys(out).length === 0) {
    return { ok: false, error: "No changes proposed" };
  }
  return { ok: true, value: out };
}

export const RATIONALE_MIN = 8;
export const RATIONALE_MAX = 4000;

export function validateRationale(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== "string") return { ok: false, error: "rationale must be a string" };
  const trimmed = raw.trim();
  if (trimmed.length < RATIONALE_MIN) {
    return { ok: false, error: `rationale must be at least ${RATIONALE_MIN} characters` };
  }
  if (trimmed.length > RATIONALE_MAX) {
    return { ok: false, error: `rationale must be at most ${RATIONALE_MAX} characters` };
  }
  return { ok: true, value: trimmed };
}

export function validateCitationUrl(raw: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw === null || raw === undefined || raw === "") return { ok: true, value: null };
  if (typeof raw !== "string") return { ok: false, error: "citation_url must be a string" };
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: true, value: null };
  if (trimmed.length > 2000) return { ok: false, error: "citation_url too long" };
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return { ok: false, error: "citation_url must be http(s)://" };
    }
  } catch {
    return { ok: false, error: "citation_url must be a valid URL" };
  }
  return { ok: true, value: trimmed };
}

export const CONFIDENCE_TIERS = [
  "low",
  "unverified",
  "stale",
  "community_validated",
  "baseline",
] as const;

export type ConfidenceTier = (typeof CONFIDENCE_TIERS)[number];

export function confidenceLabel(tier: ConfidenceTier): string {
  switch (tier) {
    case "low":
      return "Disputed";
    case "unverified":
      return "Unverified";
    case "stale":
      return "Stale";
    case "community_validated":
      return "Verified by accountants";
    case "baseline":
      return "Baseline";
  }
}
