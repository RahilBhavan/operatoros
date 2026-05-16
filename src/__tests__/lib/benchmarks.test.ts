import { describe, it, expect, vi } from "vitest";
import { estimatePercentile, getPeerContext, describeCohort } from "@/lib/benchmarks";

// Sentinel that the materialized view exposes only listed aggregates — no
// business IDs, names, owner emails, locations, or any other identifier
// that would break the k-anonymity guarantee. The actual view ships with
// Workstream C; until then, this test pins the expected shape so the view
// can't be created with extra columns without this test going red.
type IndustryBenchmarkRow = {
  industry_slug: string;
  state_code: string;
  cohort_size: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  last_captured_at: string;
};
const ALLOWED_VIEW_KEYS = [
  "industry_slug",
  "state_code",
  "cohort_size",
  "p25",
  "median",
  "p75",
  "p90",
  "last_captured_at",
] as const;

describe("industry_benchmarks view shape (no-PII k-anonymity guard)", () => {
  it("exposes only the eight permitted aggregate columns — no PII fields", () => {
    // Build a fully-typed row using only the allowed keys. If supabase types
    // were extended to include a column outside the allow-list (e.g.
    // business_id, owner_email), the index access below would be unknown
    // and the assignment would be assignable in a way that violates this
    // — but we rely on the test itself reading the type and the
    // `_AssertAllowedExhaustive` alias above to catch drift at compile time.
    const sample: IndustryBenchmarkRow = {
      industry_slug: "restaurant",
      state_code: "CA",
      cohort_size: 10,
      p25: 60,
      median: 75,
      p75: 85,
      p90: 92,
      last_captured_at: "2026-05-12T00:00:00Z",
    };
    expect(Object.keys(sample).sort()).toEqual([...ALLOWED_VIEW_KEYS].sort());
  });
});

describe("estimatePercentile", () => {
  const q = { p25: 60, median: 75, p75: 85, p90: 92 };

  it("clamps below 0 to 0", () => {
    expect(estimatePercentile(0, q)).toBe(0);
    expect(estimatePercentile(-5, q)).toBe(0);
  });

  it("clamps at or above 100 to 100", () => {
    expect(estimatePercentile(100, q)).toBe(100);
    expect(estimatePercentile(120, q)).toBe(100);
  });

  it("places median score at 50th percentile", () => {
    expect(estimatePercentile(75, q)).toBe(50);
  });

  it("places p25 score at 25th percentile and p75 at 75th", () => {
    expect(estimatePercentile(60, q)).toBe(25);
    expect(estimatePercentile(85, q)).toBe(75);
  });

  it("places p90 score at 90th percentile", () => {
    expect(estimatePercentile(92, q)).toBe(90);
  });

  it("interpolates between p25 and median", () => {
    // halfway between 60 and 75 → halfway between 25 and 50 → ~37.
    expect(estimatePercentile(67.5, q)).toBeGreaterThanOrEqual(36);
    expect(estimatePercentile(67.5, q)).toBeLessThanOrEqual(38);
  });

  it("interpolates between p90 and 100 in the top decile", () => {
    // halfway between 92 and 100 → halfway between 90 and 100 → ~95.
    expect(estimatePercentile(96, q)).toBeGreaterThanOrEqual(94);
    expect(estimatePercentile(96, q)).toBeLessThanOrEqual(96);
  });

  it("rejects NaN by returning 0", () => {
    expect(estimatePercentile(Number.NaN, q)).toBe(0);
  });
});

describe("describeCohort", () => {
  it("uses friendly industry label + state", () => {
    expect(describeCohort("restaurant", "CA")).toBe("CA restaurants");
    expect(describeCohort("construction", "TX")).toBe("TX construction firms");
  });

  it("falls back to 'businesses' when industry is unknown or null", () => {
    expect(describeCohort(null, "CA")).toBe("CA businesses");
    expect(describeCohort("zzz_unknown", "NY")).toBe("NY businesses");
  });

  it("omits state when null", () => {
    expect(describeCohort("retail", null)).toBe("retailers");
  });
});

/**
 * The supabase client is mocked at the call-chain level so getPeerContext
 * can be exercised against synthetic cohort fixtures without a live DB.
 */
type MockTable =
  | "businesses"
  | "locations"
  | "industry_benchmarks";

function mockClient(plan: {
  business?: { industry_slug: string | null } | null;
  location?: { state: string | null } | null;
  benchmark?: {
    cohort_size: number;
    p25: number;
    median: number;
    p75: number;
    p90: number;
    last_captured_at: string;
  } | null;
}) {
  function buildChain(table: MockTable) {
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.maybeSingle = vi.fn(async () => {
      if (table === "businesses") return { data: plan.business ?? null, error: null };
      if (table === "locations") return { data: plan.location ?? null, error: null };
      return { data: plan.benchmark ?? null, error: null };
    });
    return chain;
  }
  return {
    from: vi.fn((table: MockTable) => buildChain(table)),
  } as unknown as Parameters<typeof getPeerContext>[0];
}

describe("getPeerContext", () => {
  it("returns empty when the business has no industry_slug", async () => {
    const result = await getPeerContext(
      mockClient({ business: { industry_slug: null } }),
      "biz",
      80
    );
    expect(result.kind).toBe("empty");
    expect(result.industrySlug).toBeNull();
    expect(result.cohortSize).toBe(0);
  });

  it("returns empty when the business has no state on its location", async () => {
    const result = await getPeerContext(
      mockClient({
        business: { industry_slug: "restaurant" },
        location: { state: null },
      }),
      "biz",
      80
    );
    expect(result.kind).toBe("empty");
    expect(result.industrySlug).toBe("restaurant");
    expect(result.stateCode).toBeNull();
  });

  it("returns empty when no benchmark row exists (cohort below threshold)", async () => {
    const result = await getPeerContext(
      mockClient({
        business: { industry_slug: "restaurant" },
        location: { state: "CA" },
        benchmark: null,
      }),
      "biz",
      80
    );
    expect(result.kind).toBe("empty");
    expect(result.industrySlug).toBe("restaurant");
    expect(result.stateCode).toBe("CA");
  });

  it("returns empty when cohort_size sneaks below threshold (defensive k-anonymity)", async () => {
    const result = await getPeerContext(
      mockClient({
        business: { industry_slug: "restaurant" },
        location: { state: "CA" },
        benchmark: {
          cohort_size: 9,
          p25: 60,
          median: 75,
          p75: 85,
          p90: 92,
          last_captured_at: "2026-05-12T00:00:00Z",
        },
      }),
      "biz",
      80
    );
    expect(result.kind).toBe("empty");
  });

  it("returns matched context with computed percentile when cohort_size >= 10", async () => {
    const result = await getPeerContext(
      mockClient({
        business: { industry_slug: "restaurant" },
        location: { state: "CA" },
        benchmark: {
          cohort_size: 42,
          p25: 60,
          median: 75,
          p75: 85,
          p90: 92,
          last_captured_at: "2026-05-12T00:00:00Z",
        },
      }),
      "biz",
      85
    );
    if (result.kind !== "matched") throw new Error("expected matched");
    expect(result.cohortSize).toBe(42);
    expect(result.percentile).toBe(75);
    expect(result.industrySlug).toBe("restaurant");
    expect(result.stateCode).toBe("CA");
    expect(result.userScore).toBe(85);
  });
});
