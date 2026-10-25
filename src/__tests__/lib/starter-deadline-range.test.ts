import { describe, expect, it } from "vitest";
import { buildStarterDeadlines } from "@/lib/seed-deadlines";
import type { EntityType, Industry } from "@/types/onboarding";

// The landing page (src/app/page.tsx, stat P-02) says the rule set seeds
// 10-20 starter deadlines for a 16-30 employee business with a completed profile (blank answers can
// lower it to 7). If rules change,
// update that copy together with these bounds.
const INDUSTRIES: Industry[] = [
  "restaurant", "construction", "healthcare", "retail", "personal_services",
  "business_services", "manufacturing", "transportation", "fitness", "other",
];
const ENTITIES: EntityType[] = ["llc", "s_corp", "c_corp", "sole_proprietor", "partnership", "nonprofit"];
const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
  "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

describe("starter deadlines for a 16-30 employee business", () => {
  it("seeds between 10 and 20 deadlines across every one of the 51 jurisdictions, industry, entity and contractor combination tested", () => {
    const counts: number[] = [];
    for (const state of STATES)
      for (const industry of INDUSTRIES)
        for (const entityType of ENTITIES)
          for (const hiresContractors of [true, false])
            counts.push(
              buildStarterDeadlines(
                { businessName: "Test Co", industry, state, entityType, employeeRange: "16-30", hiresContractors },
                "business-1",
                new Date("2026-10-24")
              ).length
            );
    expect(counts).toHaveLength(STATES.length * INDUSTRIES.length * ENTITIES.length * 2);
    expect(STATES).toHaveLength(51);
    expect(Math.min(...counts)).toBe(10);
    expect(Math.max(...counts)).toBe(20);
  });
});
