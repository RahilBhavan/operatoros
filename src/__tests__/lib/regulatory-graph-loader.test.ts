import { describe, it, expect, beforeEach } from "vitest";
import {
  loadActiveRules,
  invalidateRulesCache,
  _peekRulesCache,
  LEGACY_RULES,
  type RulesClient,
} from "@/lib/regulatory-graph";

/**
 * Coverage for the DB-backed rule loader. Asserts:
 *   • happy path: valid DB rows → parsed RuleDefs, source = "db"
 *   • empty DB → fallback to LEGACY_RULES
 *   • DB error  → fallback to LEGACY_RULES
 *   • thrown exception → fallback to LEGACY_RULES
 *   • cache hit  → returns cached, source = "cache"
 *   • cache expiry → re-queries
 *   • invalidateRulesCache() clears
 *   • malformed row is skipped + counted; surviving rows still served
 *   • all rows malformed → fallback
 */

const validRow = {
  id: "20000000-0000-4000-8000-000000000010",
  jurisdiction_type: "federal" as const,
  jurisdiction_code: "US",
  industry_slug: null,
  rule_key: "federal-test-rule",
  name: "Test Federal Rule",
  description: "A test rule for the loader specs.",
  deadline_type: "tax_filing",
  governing_agency: "IRS",
  frequency: "annual",
  due_date_rule: { kind: "next_md", month: 3, day: 15 },
  applies_when: { entity_in: ["c_corp"] },
  severity_tier: "critical" as const,
  penalty_estimate_cents: 50000,
  source_url: "https://www.irs.gov/test",
  statute_citation: "IRC §test",
  version: 1,
};

function clientReturning(
  result: { data: unknown[] | null; error: { message: string } | null } | Error
): RulesClient {
  return {
    from() {
      return {
        select() {
          return {
            is() {
              return {
                async is() {
                  if (result instanceof Error) throw result;
                  return result;
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("loadActiveRules", () => {
  beforeEach(() => {
    invalidateRulesCache();
  });

  it("happy path: DB rows are parsed and returned", async () => {
    const client = clientReturning({ data: [validRow], error: null });
    const result = await loadActiveRules({ client });
    expect(result.source).toBe("db");
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].rule_key).toBe("federal-test-rule");
    expect(result.rules[0].name_template).toBe("Test Federal Rule");
    expect(result.rules[0].agency_template).toBe("IRS");
    expect(result.rules[0].penalty_estimate_cents).toBe(50000);
  });

  it("empty DB falls back to LEGACY_RULES", async () => {
    const client = clientReturning({ data: [], error: null });
    const result = await loadActiveRules({ client });
    expect(result.source).toBe("fallback");
    expect(result.rules).toBe(LEGACY_RULES);
  });

  it("DB error falls back to LEGACY_RULES", async () => {
    const client = clientReturning({ data: null, error: { message: "boom" } });
    const result = await loadActiveRules({ client });
    expect(result.source).toBe("fallback");
    expect(result.rules).toBe(LEGACY_RULES);
  });

  it("thrown exception falls back to LEGACY_RULES", async () => {
    const client = clientReturning(new Error("network down"));
    const result = await loadActiveRules({ client });
    expect(result.source).toBe("fallback");
    expect(result.rules).toBe(LEGACY_RULES);
  });

  it("cache hit returns cached result without re-querying", async () => {
    const client = clientReturning({ data: [validRow], error: null });
    await loadActiveRules({ client, now: 1000 });

    let secondCallCount = 0;
    const secondClient: RulesClient = {
      from() {
        secondCallCount += 1;
        return clientReturning({ data: [validRow], error: null }).from(
          "regulatory_rules"
        );
      },
    };
    const result = await loadActiveRules({ client: secondClient, now: 1000 + 60_000 });
    expect(result.source).toBe("cache");
    expect(secondCallCount).toBe(0);
  });

  it("cache expires after 10 minutes and re-queries", async () => {
    const client = clientReturning({ data: [validRow], error: null });
    await loadActiveRules({ client, now: 1000 });

    let reFetched = 0;
    const second: RulesClient = {
      from() {
        reFetched += 1;
        return clientReturning({ data: [validRow], error: null }).from(
          "regulatory_rules"
        );
      },
    };
    const result = await loadActiveRules({
      client: second,
      now: 1000 + 11 * 60 * 1000,
    });
    expect(result.source).toBe("db");
    expect(reFetched).toBe(1);
  });

  it("bypassCache forces a re-query", async () => {
    const client = clientReturning({ data: [validRow], error: null });
    await loadActiveRules({ client, now: 1000 });

    let fetched = 0;
    const second: RulesClient = {
      from() {
        fetched += 1;
        return clientReturning({ data: [validRow], error: null }).from(
          "regulatory_rules"
        );
      },
    };
    await loadActiveRules({ client: second, now: 1500, bypassCache: true });
    expect(fetched).toBe(1);
  });

  it("invalidateRulesCache() clears the cache", async () => {
    const client = clientReturning({ data: [validRow], error: null });
    await loadActiveRules({ client });
    expect(_peekRulesCache()).not.toBeNull();
    invalidateRulesCache();
    expect(_peekRulesCache()).toBeNull();
  });

  it("invalid row is skipped, valid rows still served", async () => {
    const malformed = { ...validRow, id: "not-a-uuid" };
    const client = clientReturning({
      data: [validRow, malformed, { ...validRow, id: "30000000-0000-4000-8000-000000000001" }],
      error: null,
    });
    const result = await loadActiveRules({ client });
    expect(result.source).toBe("db");
    expect(result.rules).toHaveLength(2);
    expect(result.invalid_row_count).toBe(1);
  });

  it("all rows invalid falls back", async () => {
    const malformed = { ...validRow, id: "not-a-uuid" };
    const client = clientReturning({ data: [malformed, malformed], error: null });
    const result = await loadActiveRules({ client });
    expect(result.source).toBe("fallback");
    expect(result.invalid_row_count).toBe(2);
    expect(result.rules).toBe(LEGACY_RULES);
  });

  it("DB-loaded rules drive buildStarterDeadlines output", async () => {
    // Composability test: a DB rule that exists ONLY in the DB and not in
    // LEGACY_RULES should still produce a deadline when the loader's
    // result is passed to buildStarterDeadlines.
    const dbOnlyRule = {
      ...validRow,
      id: "40000000-0000-4000-8000-000000000001",
      rule_key: "db-only-test-rule",
      name: "DB-Only Test Rule",
      applies_when: { state: "CA" },
    };
    const client = clientReturning({ data: [dbOnlyRule], error: null });
    const { rules } = await loadActiveRules({ client });
    const { buildStarterDeadlines } = await import("@/lib/seed-deadlines");
    const seeds = buildStarterDeadlines(
      {
        businessName: "T",
        state: "CA",
        entityType: "c_corp",
        industry: null,
        employeeRange: "1",
        hiresContractors: false,
      },
      "biz-x",
      new Date(2026, 0, 15),
      rules
    );
    expect(seeds.map((s) => s.rule_id)).toContain("db-only-test-rule");
  });
});
