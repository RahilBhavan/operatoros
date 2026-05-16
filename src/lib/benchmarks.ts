import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type PeerContext = {
  kind: "matched";
  industrySlug: string;
  stateCode: string;
  cohortSize: number;
  userScore: number;
  percentile: number;
  median: number;
  p25: number;
  p75: number;
  p90: number;
  lastCapturedAt: string;
};

export type PeerEmpty = {
  kind: "empty";
  industrySlug: string | null;
  stateCode: string | null;
  cohortSize: number;
};

export type PeerResult = PeerContext | PeerEmpty;

type Quartiles = { p25: number; median: number; p75: number; p90: number };

export function estimatePercentile(score: number, q: Quartiles): number {
  if (!Number.isFinite(score)) return 0;
  if (score <= 0) return 0;
  if (score >= 100) return 100;
  if (score <= q.p25) {
    return Math.round((score / Math.max(q.p25, 1)) * 25);
  }
  if (score <= q.median) {
    const span = Math.max(q.median - q.p25, 1);
    return Math.round(25 + ((score - q.p25) / span) * 25);
  }
  if (score <= q.p75) {
    const span = Math.max(q.p75 - q.median, 1);
    return Math.round(50 + ((score - q.median) / span) * 25);
  }
  if (score <= q.p90) {
    const span = Math.max(q.p90 - q.p75, 1);
    return Math.round(75 + ((score - q.p75) / span) * 15);
  }
  const span = Math.max(100 - q.p90, 1);
  return Math.round(90 + ((score - q.p90) / span) * 10);
}

const COHORT_THRESHOLD = 10;

export async function getPeerContext(
  supabase: SupabaseClient<Database>,
  businessId: string,
  userScore: number
): Promise<PeerResult> {
  const { data: business } = await supabase
    .from("businesses")
    .select("industry_slug")
    .eq("id", businessId)
    .maybeSingle();

  const industrySlug = business?.industry_slug ?? null;
  if (!industrySlug) {
    return { kind: "empty", industrySlug: null, stateCode: null, cohortSize: 0 };
  }

  const { data: location } = await supabase
    .from("locations")
    .select("state")
    .eq("business_id", businessId)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  const stateCode = location?.state ?? null;
  if (!stateCode) {
    return { kind: "empty", industrySlug, stateCode: null, cohortSize: 0 };
  }

  const { data: bench } = await supabase
    .from("industry_benchmarks")
    .select("cohort_size, p25, median, p75, p90, last_captured_at")
    .eq("industry_slug", industrySlug)
    .eq("state_code", stateCode)
    .maybeSingle();

  if (!bench || bench.cohort_size < COHORT_THRESHOLD) {
    return { kind: "empty", industrySlug, stateCode, cohortSize: bench?.cohort_size ?? 0 };
  }

  const q: Quartiles = {
    p25: Number(bench.p25),
    median: Number(bench.median),
    p75: Number(bench.p75),
    p90: Number(bench.p90),
  };

  return {
    kind: "matched",
    industrySlug,
    stateCode,
    cohortSize: bench.cohort_size,
    userScore,
    percentile: estimatePercentile(userScore, q),
    median: q.median,
    p25: q.p25,
    p75: q.p75,
    p90: q.p90,
    lastCapturedAt: bench.last_captured_at,
  };
}

const INDUSTRY_LABELS: Record<string, string> = {
  restaurant: "restaurants",
  construction: "construction firms",
  healthcare: "healthcare practices",
  retail: "retailers",
  personal_services: "personal-service businesses",
  business_services: "business-service firms",
  manufacturing: "manufacturers",
  transportation: "transportation operators",
  fitness: "fitness studios",
  other: "businesses",
};

export function describeCohort(industrySlug: string | null, stateCode: string | null): string {
  const industry = industrySlug ? INDUSTRY_LABELS[industrySlug] ?? "businesses" : "businesses";
  return stateCode ? `${stateCode} ${industry}` : industry;
}
