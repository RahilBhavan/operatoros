import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Healthcare-vertical industry slugs that require a signed BAA before
 * PHI-classified records may be written. Mirrors the set used by the
 * BAA settings page; expand when the taxonomy gains finer slugs.
 */
const HEALTHCARE_INDUSTRY_SLUGS = new Set<string>(["healthcare"]);

export function requiresBaa(industrySlug: string | null | undefined): boolean {
  return HEALTHCARE_INDUSTRY_SLUGS.has(industrySlug ?? "");
}

/**
 * Returns `null` when the business is allowed to proceed (non-healthcare
 * verticals, or healthcare with an active BAA on file). Returns an
 * `{ error, status }` shape when the route should refuse with 409 —
 * callers turn that into a NextResponse.
 *
 * Centralising this here keeps every PHI-mutating handler honest: a
 * healthcare-flagged business cannot write staff credentials, audit
 * binders, COI records, or filings until a BAA is signed.
 */
export async function checkBaaForPhi(
  supabase: SupabaseClient,
  args: { businessId: string; industrySlug: string | null }
): Promise<{ error: string; status: number } | null> {
  if (!requiresBaa(args.industrySlug)) return null;

  const { data: baa } = await supabase
    .from("business_associate_agreements")
    .select("id")
    .eq("business_id", args.businessId)
    .is("revoked_at", null)
    .limit(1)
    .maybeSingle();

  if (baa) return null;
  return {
    error:
      "Sign the Business Associate Agreement at /settings/baa before adding PHI-classified records.",
    status: 409,
  };
}
