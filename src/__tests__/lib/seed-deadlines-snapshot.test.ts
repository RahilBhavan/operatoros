import { describe, it, expect } from "vitest";
import { buildStarterDeadlines } from "@/lib/seed-deadlines";
import type { OnboardingData } from "@/types/onboarding";

/**
 * Snapshot equivalence test for the Workstream A rule-graph refactor.
 *
 * The hardcoded per-block engine in seed-deadlines.ts was replaced with a
 * declarative rule graph driven by regulatory-graph.ts::LEGACY_RULES. This
 * test pins the rule-graph output across the same canonical combos covered
 * by the original behavioural tests so any future rule change shows up as
 * a reviewable snapshot diff. If the snapshot legitimately needs to move
 * (real rule update / new agency), update it via `vitest -u`.
 *
 * Determinism: deadlines are sorted by (rule_id, occurrence_key) before
 * snapshotting so unrelated iteration-order changes don't break the diff.
 */

const REF = new Date(2026, 0, 15);
const BIZ = "biz-snapshot-id";

const COMBOS: Array<{ label: string; data: OnboardingData }> = [
  {
    label: "CA LLC restaurant 6-15",
    data: {
      businessName: "Snap CA",
      state: "CA",
      entityType: "llc",
      industry: "restaurant",
      employeeRange: "6-15",
      hiresContractors: false,
    },
  },
  {
    label: "TX S-Corp construction 2-5 contractors",
    data: {
      businessName: "Snap TX",
      state: "TX",
      entityType: "s_corp",
      industry: "construction",
      employeeRange: "2-5",
      hiresContractors: true,
    },
  },
  {
    label: "NY sole prop healthcare 1",
    data: {
      businessName: "Snap NY",
      state: "NY",
      entityType: "sole_proprietor",
      industry: "healthcare",
      employeeRange: "1",
      hiresContractors: false,
    },
  },
  {
    label: "FL C-Corp retail 1",
    data: {
      businessName: "Snap FL",
      state: "FL",
      entityType: "c_corp",
      industry: "retail",
      employeeRange: "1",
      hiresContractors: false,
    },
  },
  {
    label: "DE LLC other 1",
    data: {
      businessName: "Snap DE",
      state: "DE",
      entityType: "llc",
      industry: "other",
      employeeRange: "1",
      hiresContractors: false,
    },
  },
  {
    label: "NY LLC construction 31-50 contractors",
    data: {
      businessName: "Snap NY Big",
      state: "NY",
      entityType: "llc",
      industry: "construction",
      employeeRange: "31-50",
      hiresContractors: true,
    },
  },
];

function digestable(data: OnboardingData) {
  return buildStarterDeadlines(data, BIZ, REF)
    .map((d) => ({
      name: d.name,
      due_date: d.due_date,
      frequency: d.frequency,
      severity_tier: d.severity_tier,
      governing_agency: d.governing_agency,
      rule_id: d.rule_id,
      rule_version: d.rule_version,
      occurrence_key: d.occurrence_key,
    }))
    .sort((a, b) => {
      const k = a.rule_id.localeCompare(b.rule_id);
      return k !== 0 ? k : a.occurrence_key.localeCompare(b.occurrence_key);
    });
}

describe("regulatory-graph snapshot", () => {
  for (const combo of COMBOS) {
    it(`${combo.label}`, () => {
      expect(digestable(combo.data)).toMatchSnapshot();
    });
  }
});
