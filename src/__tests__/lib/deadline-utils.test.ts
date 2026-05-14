import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  daysUntil,
  formatDueDate,
  computeAutoStatus,
  computeComplianceScore,
  escapeHtml,
  formatIsoDate,
  type DeadlineLike,
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

  it("calculates mixed score correctly", () => {
    const deadlines: DeadlineLike[] = [
      { due_date: isoDate(-5), status: "compliant" }, // compliant
      { due_date: isoDate(60), status: "upcoming" },  // upcoming (good)
      { due_date: isoDate(-1), status: "overdue" },   // overdue (bad)
      { due_date: isoDate(10), status: "in_progress" }, // in_progress (bad)
    ];
    // (1 compliant + 1 upcoming) / 4 = 50%
    expect(computeComplianceScore(deadlines)).toBe(50);
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
