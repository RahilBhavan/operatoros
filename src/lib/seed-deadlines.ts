/**
 * Starter deadline builder.
 *
 * Thin wrapper around the regulatory rule graph: filters the rule set
 * against the user's onboarding profile, then materialises each matching
 * rule into one or more DeadlineSeed rows (typically one, except for
 * cadence rules like quarterly_941 that emit multiple upcoming dates).
 *
 * Behaviour is fully delegated to `regulatory-graph.ts`; this file
 * preserves the historical public signature so call sites (the
 * onboarding server action, the test suite) need no changes.
 */

import type { OnboardingData } from "@/types/onboarding";
import {
  LEGACY_RULES,
  getApplicableRules,
  materializeRuleToDeadlines,
  type RuleDef,
} from "@/lib/regulatory-graph";

export type { DeadlineSeed, SeverityTier } from "@/lib/regulatory-graph";

// Retained for any legacy importers; not used internally any more. The
// canonical implementations live in regulatory-graph.ts (next_md /
// quarterly_941 due_date_rule kinds respectively).
export function nextDate(month: number, day: number, referenceDate?: Date): Date {
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(today.getFullYear(), month, day);
  if (candidate <= today) candidate.setFullYear(candidate.getFullYear() + 1);
  return candidate;
}

export function next941Dates(n: number, referenceDate?: Date): Date[] {
  const quarterEnds: Array<[number, number]> = [
    [3, 30],
    [6, 31],
    [9, 31],
    [0, 31],
  ];
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);
  const out: Date[] = [];
  for (let year = today.getFullYear(); out.length < n; year++) {
    for (const [m, d] of quarterEnds) {
      const dt = new Date(year, m, d);
      if (dt > today) out.push(dt);
      if (out.length >= n) break;
    }
  }
  return out;
}

/**
 * Builds the starter set of compliance deadlines for a new business.
 * Pure function — no side effects, no network calls.
 *
 * Reference date defaults to "now" but tests pass an explicit one for
 * determinism. Rule set defaults to the in-memory LEGACY_RULES mirror;
 * the onboarding server action loads from the DB via
 * `loadActiveRules()` and passes the result in so admin verifies and
 * (future) corrections flow through to new businesses without a
 * redeploy.
 */
export function buildStarterDeadlines(
  data: OnboardingData,
  businessId: string,
  referenceDate?: Date,
  rules: RuleDef[] = LEGACY_RULES
): ReturnType<typeof materializeRuleToDeadlines> {
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);
  const applicable = getApplicableRules(data, rules);
  return applicable.flatMap((rule) =>
    materializeRuleToDeadlines(rule, data, businessId, today)
  );
}
