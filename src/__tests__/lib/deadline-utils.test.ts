import { describe, it, expect } from "vitest";
import {
  daysUntil,
  formatDueDate,
  computeAutoStatus,
  computeComplianceScore,
  computeRiskWeightedScore,
  computeExposureCents,
  topActions,
  formatCents,
  escapeHtml,
  formatIsoDate,
  type DeadlineLike,
  type DeadlineWithSeverity,
} from "@/lib/deadline-utils";

function isoDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

describe("daysUntil", () => {
  it("returns 0 for today", () => {
    expect(daysUntil(isoDate(0))).toBe(0);
  });

  it("returns positive for future dates", () => {
    expect(daysUntil(isoDate(5))).toBe(5);
    expect(daysUntil(isoDate(30))).toBe(30);
  });

  it("returns negative for past dates", () => {
    expect(daysUntil(isoDate(-1))).toBe(-1);
    expect(daysUntil(isoDate(-10))).toBe(-10);
  });
});

describe("formatDueDate", () => {
  it("shows overdue label for past dates", () => {
    expect(formatDueDate(isoDate(-3))).toBe("3 days overdue");
    expect(formatDueDate(isoDate(-1))).toBe("1 days overdue");
  });

  it("shows 'Due today' for today", () => {
    expect(formatDueDate(isoDate(0))).toBe("Due today");
  });

  it("shows 'Due in N days' for dates <=30 days away", () => {
    expect(formatDueDate(isoDate(1))).toBe("Due in 1 days");
    expect(formatDueDate(isoDate(30))).toBe("Due in 30 days");
  });

  it("shows formatted date for dates >30 days away", () => {
    const result = formatDueDate(isoDate(31));
    expect(result).toMatch(/[A-Z][a-z]+\.? \d+, \d{4}/);
  });
});

describe("computeAutoStatus", () => {
  it("returns 'compliant' when status is compliant regardless of date", () => {
    const d: DeadlineLike = { due_date: isoDate(-5), status: "compliant" };
    expect(computeAutoStatus(d)).toBe("compliant");
  });

  it("returns 'overdue' for past due dates with non-compliant status", () => {
    const d: DeadlineLike = { due_date: isoDate(-1), status: "upcoming" };
    expect(computeAutoStatus(d)).toBe("overdue");
  });

  it("returns 'in_progress' for dates within 30 days", () => {
    const d: DeadlineLike = { due_date: isoDate(15), status: "upcoming" };
    expect(computeAutoStatus(d)).toBe("in_progress");
  });

  it("returns 'in_progress' for today", () => {
    const d: DeadlineLike = { due_date: isoDate(0), status: "upcoming" };
    expect(computeAutoStatus(d)).toBe("in_progress");
  });

  it("returns 'upcoming' for dates more than 30 days away", () => {
    const d: DeadlineLike = { due_date: isoDate(31), status: "upcoming" };
    expect(computeAutoStatus(d)).toBe("upcoming");
  });
});

describe("computeComplianceScore", () => {
  it("returns 100 for empty list", () => {
    expect(computeComplianceScore([])).toBe(100);
  });

  it("returns 100 when all are compliant", () => {
    const deadlines: DeadlineLike[] = [
      { due_date: isoDate(-5), status: "compliant" },
      { due_date: isoDate(-10), status: "compliant" },
    ];
    expect(computeComplianceScore(deadlines)).toBe(100);
  });

  it("returns 0 when all are overdue", () => {
    const deadlines: DeadlineLike[] = [
      { due_date: isoDate(-1), status: "overdue" },
      { due_date: isoDate(-5), status: "overdue" },
    ];
    expect(computeComplianceScore(deadlines)).toBe(0);
  });

  it("upcoming is NOT equivalent to compliant — all-upcoming scores 50", () => {
    // This tests the critical fix: upcoming ≠ compliant.
    // All upcoming → 5pts each / 10pts max each = 50%
    const deadlines: DeadlineLike[] = [
      { due_date: isoDate(60), status: "upcoming" },
      { due_date: isoDate(90), status: "upcoming" },
    ];
    expect(computeComplianceScore(deadlines)).toBe(50);
  });

  it("compliant scores higher than upcoming for identical set", () => {
    const allCompliant: DeadlineLike[] = [
      { due_date: isoDate(-5), status: "compliant" },
      { due_date: isoDate(-10), status: "compliant" },
    ];
    const allUpcoming: DeadlineLike[] = [
      { due_date: isoDate(60), status: "upcoming" },
      { due_date: isoDate(90), status: "upcoming" },
    ];
    expect(computeComplianceScore(allCompliant)).toBeGreaterThan(
      computeComplianceScore(allUpcoming)
    );
  });

  it("one overdue item heavily penalizes an otherwise clean calendar", () => {
    const deadlines: DeadlineLike[] = [
      { due_date: isoDate(-5), status: "compliant" },
      { due_date: isoDate(-10), status: "compliant" },
      { due_date: isoDate(-15), status: "compliant" },
      { due_date: isoDate(-3), status: "overdue" }, // one failure
    ];
    // (30 - 20) / 40 = 10/40 = 25
    expect(computeComplianceScore(deadlines)).toBe(25);
  });

  it("mixed statuses score correctly with new weights", () => {
    const deadlines: DeadlineLike[] = [
      { due_date: isoDate(-5), status: "compliant" },  // +10
      { due_date: isoDate(60), status: "upcoming" },   // +5
      { due_date: isoDate(-1), status: "overdue" },    // -20
      { due_date: isoDate(10), status: "in_progress" }, // 0
    ];
    // actual: 10 + 5 - 20 + 0 = -5, max = 40
    // score: max(0, -5/40 * 100) = 0
    expect(computeComplianceScore(deadlines)).toBe(0);
  });

  it("uses custom getStatus function when provided", () => {
    const deadlines: DeadlineLike[] = [
      { due_date: isoDate(0), status: "upcoming" },
    ];
    const alwaysCompliant = () => "compliant" as const;
    expect(computeComplianceScore(deadlines, alwaysCompliant)).toBe(100);
  });
});

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("escapes less-than", () => {
    expect(escapeHtml("1 < 2")).toBe("1 &lt; 2");
  });

  it("escapes greater-than", () => {
    expect(escapeHtml("2 > 1")).toBe("2 &gt; 1");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes all special chars together", () => {
    expect(escapeHtml('<script>alert("xss & injection")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss &amp; injection&quot;)&lt;/script&gt;"
    );
  });

  it("returns plain strings unchanged", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});

describe("formatIsoDate", () => {
  it("formats a Date to YYYY-MM-DD", () => {
    const d = new Date(2026, 0, 15); // Jan 15 2026
    expect(formatIsoDate(d)).toBe("2026-01-15");
  });

  it("pads month and day with zeros", () => {
    const d = new Date(2026, 2, 5); // Mar 5 2026
    expect(formatIsoDate(d)).toBe("2026-03-05");
  });
});

describe("computeRiskWeightedScore", () => {
  it("returns 100 for empty deadlines", () => {
    expect(computeRiskWeightedScore([])).toBe(100);
  });

  it("weights critical-severity overdue items more harshly than low", () => {
    const overdueDate = isoDate(-1);
    const criticalOverdue: DeadlineWithSeverity[] = [
      { due_date: overdueDate, status: "upcoming", severity_tier: "critical" },
      { due_date: isoDate(60), status: "upcoming", severity_tier: "low" },
    ];
    const lowOverdue: DeadlineWithSeverity[] = [
      { due_date: isoDate(60), status: "upcoming", severity_tier: "critical" },
      { due_date: overdueDate, status: "upcoming", severity_tier: "low" },
    ];
    const critScore = computeRiskWeightedScore(criticalOverdue);
    const lowScore = computeRiskWeightedScore(lowOverdue);
    expect(critScore).toBeLessThan(lowScore);
  });

  it("rewards compliant items proportionally to severity", () => {
    const allCompliantCritical: DeadlineWithSeverity[] = [
      { due_date: isoDate(60), status: "compliant", severity_tier: "critical" },
    ];
    expect(computeRiskWeightedScore(allCompliantCritical)).toBe(100);
  });

  it("falls back to medium weight when severity_tier is missing", () => {
    const unweighted: DeadlineWithSeverity[] = [
      { due_date: isoDate(60), status: "upcoming" },
    ];
    expect(computeRiskWeightedScore(unweighted)).toBe(50);
  });
});

describe("computeExposureCents", () => {
  it("sums penalty_estimate_cents for overdue + in_progress items only", () => {
    const ds: DeadlineWithSeverity[] = [
      { due_date: isoDate(-1), status: "upcoming", penalty_estimate_cents: 100000 },
      { due_date: isoDate(5), status: "upcoming", penalty_estimate_cents: 50000 },
      { due_date: isoDate(60), status: "upcoming", penalty_estimate_cents: 1000000 },
      { due_date: isoDate(10), status: "compliant", penalty_estimate_cents: 999999 },
    ];
    expect(computeExposureCents(ds)).toBe(150000);
  });

  it("returns 0 when no items are overdue or due-soon", () => {
    const ds: DeadlineWithSeverity[] = [
      { due_date: isoDate(60), status: "upcoming", penalty_estimate_cents: 1000000 },
    ];
    expect(computeExposureCents(ds)).toBe(0);
  });
});

describe("topActions", () => {
  it("returns up to N items, prioritizing overdue + critical severity", () => {
    const ds: DeadlineWithSeverity[] = [
      {
        id: "a",
        name: "Critical overdue",
        due_date: isoDate(-2),
        status: "upcoming",
        severity_tier: "critical",
        penalty_estimate_cents: 200000,
      },
      {
        id: "b",
        name: "Low due-soon",
        due_date: isoDate(5),
        status: "upcoming",
        severity_tier: "low",
        penalty_estimate_cents: 0,
      },
      {
        id: "c",
        name: "Medium overdue",
        due_date: isoDate(-1),
        status: "upcoming",
        severity_tier: "medium",
        penalty_estimate_cents: 50000,
      },
      {
        id: "d",
        name: "Future compliant",
        due_date: isoDate(60),
        status: "compliant",
        severity_tier: "critical",
        penalty_estimate_cents: 0,
      },
    ];
    const top = topActions(ds, 2);
    expect(top.length).toBe(2);
    expect(top[0].name).toBe("Critical overdue");
    expect(top.find((t) => t.name === "Future compliant")).toBeUndefined();
  });

  it("returns empty array if no overdue or due-soon items", () => {
    const ds: DeadlineWithSeverity[] = [
      { id: "a", name: "Future", due_date: isoDate(60), status: "upcoming", severity_tier: "low" },
    ];
    expect(topActions(ds)).toEqual([]);
  });
});

describe("formatCents", () => {
  it("formats small amounts without commas", () => {
    expect(formatCents(2000)).toBe("$20");
    expect(formatCents(50000)).toBe("$500");
  });

  it("formats large amounts with commas", () => {
    expect(formatCents(500000)).toBe("$5,000");
    expect(formatCents(1000000)).toBe("$10,000");
  });

  it("returns $0 for non-positive amounts", () => {
    expect(formatCents(0)).toBe("$0");
    expect(formatCents(-100)).toBe("$0");
  });
});
