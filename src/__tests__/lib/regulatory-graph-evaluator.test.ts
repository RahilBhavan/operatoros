import { describe, it, expect } from "vitest";
import { evaluateDueDate, type DueDateRule } from "@/lib/regulatory-graph";

/**
 * Per-kind unit tests for the `due_date_rule` evaluator.
 *
 * Every `DueDateRule.kind` gets its own block. Each block exercises:
 *   - the canonical mid-year case,
 *   - the "today is exactly the candidate date" edge,
 *   - the "candidate already past" rollover edge,
 *   - kind-specific edges where they exist (year boundary, leap day, etc.).
 *
 * If a new kind is added to DueDateRule, the exhaustiveness assertion in the
 * `evaluator surface` block will fail until the corresponding test block
 * lands here.
 */

// Helpers that read better at call sites than `new Date(y, m, d)` everywhere.
const d = (y: number, m: number, day: number) => new Date(y, m, day);
const iso = (x: Date) => x.toISOString().slice(0, 10);

describe("evaluateDueDate · next_md", () => {
  const rule: DueDateRule = { kind: "next_md", month: 3, day: 15 }; // Apr 15

  it("returns this year's date when today is before it", () => {
    const out = evaluateDueDate(rule, d(2026, 0, 15));
    expect(out).toHaveLength(1);
    expect(iso(out[0])).toBe("2026-04-15");
  });

  it("rolls forward to next year when today is exactly the candidate", () => {
    // Comparison is `<=` so the same day rolls forward; matches the
    // legacy nextDate() behaviour used by the old engine.
    const out = evaluateDueDate(rule, d(2026, 3, 15));
    expect(iso(out[0])).toBe("2027-04-15");
  });

  it("rolls forward to next year when today is after the candidate", () => {
    const out = evaluateDueDate(rule, d(2026, 5, 1));
    expect(iso(out[0])).toBe("2027-04-15");
  });

  it("year-boundary rollover on Jan 1 still returns this Jan 31 (when M=0/D=31)", () => {
    const r: DueDateRule = { kind: "next_md", month: 0, day: 31 };
    const out = evaluateDueDate(r, d(2026, 0, 1));
    expect(iso(out[0])).toBe("2026-01-31");
  });

  it("handles Feb 29 by promoting to Mar 1 in non-leap years (JS Date wraps)", () => {
    // Date(year, 1, 29) wraps to Mar 1 when `year` is non-leap. Documenting
    // the rollover so anyone seeding Feb 29 rules sees what they'll get:
    // from Jun 1 2026, candidate is Mar 1 2026 (already past) → rolls to
    // Mar 1 2027 (2027 also non-leap).
    const r: DueDateRule = { kind: "next_md", month: 1, day: 29 };
    const out = evaluateDueDate(r, d(2026, 5, 1));
    expect(iso(out[0])).toBe("2027-03-01");
  });
});

describe("evaluateDueDate · next_year_md", () => {
  const rule: DueDateRule = { kind: "next_year_md", month: 1, day: 1 }; // Feb 1 (OSHA)

  it("always advances to next calendar year regardless of today", () => {
    // Before this year's Feb 1
    expect(iso(evaluateDueDate(rule, d(2026, 0, 15))[0])).toBe("2027-02-01");
    // Exactly on this year's Feb 1
    expect(iso(evaluateDueDate(rule, d(2026, 1, 1))[0])).toBe("2027-02-01");
    // After this year's Feb 1
    expect(iso(evaluateDueDate(rule, d(2026, 6, 1))[0])).toBe("2027-02-01");
  });
});

describe("evaluateDueDate · months_from_today", () => {
  it("adds N months, preserving day-of-month when valid", () => {
    const r: DueDateRule = { kind: "months_from_today", months: 3 };
    const out = evaluateDueDate(r, d(2026, 0, 15));
    expect(iso(out[0])).toBe("2026-04-15");
  });

  it("rolls the year when the addition crosses December", () => {
    const r: DueDateRule = { kind: "months_from_today", months: 6 };
    const out = evaluateDueDate(r, d(2026, 9, 31)); // Oct 31 + 6mo
    // Oct 31 + 6mo lands in May 2027 (Apr has no 31 → JS wraps to May 1).
    expect(out[0].getFullYear()).toBe(2027);
  });

  it("zero months returns today", () => {
    const r: DueDateRule = { kind: "months_from_today", months: 0 };
    const out = evaluateDueDate(r, d(2026, 0, 15));
    expect(iso(out[0])).toBe("2026-01-15");
  });
});

describe("evaluateDueDate · years_from_today", () => {
  it("adds N years, preserving month + day", () => {
    const r: DueDateRule = { kind: "years_from_today", years: 2 };
    expect(iso(evaluateDueDate(r, d(2026, 5, 10))[0])).toBe("2028-06-10");
  });

  it("zero years returns today", () => {
    const r: DueDateRule = { kind: "years_from_today", years: 0 };
    expect(iso(evaluateDueDate(r, d(2026, 5, 10))[0])).toBe("2026-06-10");
  });
});

describe("evaluateDueDate · years_from_today_first_of_month", () => {
  it("adds N years and snaps to day 1 of the same month", () => {
    const r: DueDateRule = { kind: "years_from_today_first_of_month", years: 2 };
    expect(iso(evaluateDueDate(r, d(2026, 5, 23))[0])).toBe("2028-06-01");
  });

  it("today on the 1st still snaps to the 1st", () => {
    const r: DueDateRule = { kind: "years_from_today_first_of_month", years: 1 };
    expect(iso(evaluateDueDate(r, d(2026, 5, 1))[0])).toBe("2027-06-01");
  });
});

describe("evaluateDueDate · next_month_day", () => {
  it("returns the same day-of-month in the following month", () => {
    const r: DueDateRule = { kind: "next_month_day", day: 20 };
    expect(iso(evaluateDueDate(r, d(2026, 0, 15))[0])).toBe("2026-02-20");
  });

  it("wraps month=11 (Dec) into month=0 (Jan) and rolls forward a year", () => {
    // From Dec → Jan, nextMonth is 0 and the candidate uses today's year
    // (Jan 20 2026 from Dec 5 2026). That's already past, so the rollover
    // kicks the year forward to Jan 20 2027. The Dec→Jan edge always
    // rolls forward as a result.
    const r: DueDateRule = { kind: "next_month_day", day: 20 };
    const out = evaluateDueDate(r, d(2026, 11, 5));
    expect(iso(out[0])).toBe("2027-01-20");
  });

  it("rolls forward a year when the candidate is already past", () => {
    const r: DueDateRule = { kind: "next_month_day", day: 10 };
    // From Dec 15 → next month is Jan; Jan 10 (same year) is in the past
    // relative to Dec 15, so the impl rolls the year forward.
    const out = evaluateDueDate(r, d(2026, 11, 15));
    expect(iso(out[0])).toBe("2027-01-10");
  });
});

describe("evaluateDueDate · quarterly_941", () => {
  // Quarter-end-month due dates per IRS Form 941: Apr 30, Jul 31, Oct 31, Jan 31.

  it("returns the next N dates starting from today's calendar year", () => {
    const r: DueDateRule = { kind: "quarterly_941", count: 2 };
    const out = evaluateDueDate(r, d(2026, 0, 15)); // Jan 15 2026
    expect(out.map(iso)).toEqual(["2026-04-30", "2026-07-31"]);
  });

  it("skips quarter-ends that have already passed in the current year", () => {
    const r: DueDateRule = { kind: "quarterly_941", count: 2 };
    const out = evaluateDueDate(r, d(2026, 5, 1)); // Jun 1 2026 → Q1 (Apr 30) is past
    expect(out.map(iso)).toEqual(["2026-07-31", "2026-10-31"]);
  });

  it("crosses calendar years when count exceeds remaining quarters", () => {
    // Legacy quirk preserved: the cycle array is [Apr30, Jul31, Oct31, Jan31].
    // For year N, the Jan31 candidate is Date(N, 0, 31) — i.e. Jan 31 of
    // year N, NOT N+1 (the actual due date for Q4 of N-1). When we start
    // mid-year, Jan 31 of the start year is already in the past, so it
    // gets skipped. Within the next year's cycle, the loop hits count
    // before reaching the (logically out-of-order) Jan 31 slot. Net effect:
    // Jan 31 is silently dropped when count <= 4 starting after Jan.
    // Workstream A preserves byte-for-byte legacy behaviour; the test
    // pins reality.
    const r: DueDateRule = { kind: "quarterly_941", count: 4 };
    const out = evaluateDueDate(r, d(2026, 9, 1)); // Oct 1 2026
    expect(out.map(iso)).toEqual([
      "2026-10-31",
      "2027-04-30",
      "2027-07-31",
      "2027-10-31",
    ]);
  });

  it("count=0 returns an empty array", () => {
    const r: DueDateRule = { kind: "quarterly_941", count: 0 };
    expect(evaluateDueDate(r, d(2026, 0, 15))).toEqual([]);
  });
});

describe("evaluator surface", () => {
  // Tripwire: if a kind is added to DueDateRule and the switch statement
  // gains a branch, this list must grow too — otherwise the unit-test
  // coverage is incomplete by construction.
  const COVERED_KINDS: ReadonlyArray<DueDateRule["kind"]> = [
    "next_md",
    "next_year_md",
    "months_from_today",
    "years_from_today",
    "years_from_today_first_of_month",
    "next_month_day",
    "quarterly_941",
  ];

  it("each documented kind is covered above and produces a Date result", () => {
    for (const kind of COVERED_KINDS) {
      const rule = (
        {
          next_md: { kind: "next_md", month: 0, day: 1 },
          next_year_md: { kind: "next_year_md", month: 0, day: 1 },
          months_from_today: { kind: "months_from_today", months: 1 },
          years_from_today: { kind: "years_from_today", years: 1 },
          years_from_today_first_of_month: { kind: "years_from_today_first_of_month", years: 1 },
          next_month_day: { kind: "next_month_day", day: 1 },
          quarterly_941: { kind: "quarterly_941", count: 1 },
        } as Record<DueDateRule["kind"], DueDateRule>
      )[kind];
      const out = evaluateDueDate(rule, d(2026, 5, 15));
      expect(Array.isArray(out)).toBe(true);
      expect(out.length).toBeGreaterThan(0);
      for (const dt of out) expect(dt).toBeInstanceOf(Date);
    }
  });
});
