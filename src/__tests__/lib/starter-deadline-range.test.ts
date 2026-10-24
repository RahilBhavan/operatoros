import { describe, expect, it } from "vitest";
import { buildStarterDeadlines } from "@/lib/seed-deadlines";
import type { EntityType, Industry } from "@/types/onboarding";

// The landing page (src/app/page.tsx, stat P-02) says the rule set seeds
// 9-20 starter deadlines for a 16-30 employee business. If rules change,
// update that copy together with these bounds.
const INDUSTRIES: Industry[] = [
  "restaurant", "construction", "healthcare", "retail", "personal_services",
  "business_services", "manufacturing", "transportation", "fitness", "other",
];
const ENTITIES: EntityType[] = ["llc", "s_corp", "c_corp", "sole_proprietor", "partnership", "nonprofit"];
const STATES = ["CA", "TX", "NY", "DE", "FL", "IL", "PA", "GA", "WY"];

describe("starter deadlines for a 16-30 employee business", () => {
  it("seeds between 9 and 20 deadlines across every state, industry, entity and contractor combination tested", () => {
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
    expect(Math.min(...counts)).toBeGreaterThanOrEqual(9);
    expect(Math.max(...counts)).toBeLessThanOrEqual(20);
  });
});
