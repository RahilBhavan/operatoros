import { describe, it, expect } from "vitest";
import { panAmPropsForDeadline, type PanAmTagDeadline } from "@/lib/pan-am-tag";

function deadline(overrides: Partial<PanAmTagDeadline> = {}): PanAmTagDeadline {
  return {
    id: "11111111-2222-3333-4444-555555555555",
    name: "Q3 941 filing",
    deadline_type: "tax",
    frequency: "quarterly",
    due_date: "2026-09-30",
    status: "upcoming",
    severity_tier: "high",
    governing_agency: "IRS",
    ...overrides,
  };
}

describe("panAmPropsForDeadline", () => {
  it("is deterministic for a given id", () => {
    const a = panAmPropsForDeadline(deadline());
    const b = panAmPropsForDeadline(deadline());
    expect(a).toEqual(b);
  });

  it("produces different artifacts for different ids", () => {
    const ids = Array.from({ length: 64 }, (_, i) =>
      `aaaaaaaa-bbbb-cccc-dddd-${i.toString(16).padStart(12, "0")}`
    );
    const serials = new Set(
      ids.map((id) => panAmPropsForDeadline(deadline({ id })).serial)
    );
    expect(serials.size).toBeGreaterThan(50);

    const stripRights = new Set(
      ids.map((id) => panAmPropsForDeadline(deadline({ id })).stripRight)
    );
    expect(stripRights.size).toBeGreaterThan(50);
  });

  it("emits a 6-digit zero-padded serial", () => {
    const p = panAmPropsForDeadline(deadline());
    expect(p.serial).toMatch(/^\d{6}$/);
  });

  it("maps deadline_type to destination + agency", () => {
    expect(panAmPropsForDeadline(deadline({ deadline_type: "tax" })))
      .toMatchObject({ destination: "IRS", agency: "irs" });
    expect(panAmPropsForDeadline(deadline({ deadline_type: "coi" })))
      .toMatchObject({ destination: "COI", agency: "insurance" });
    expect(panAmPropsForDeadline(deadline({ deadline_type: "entity_filing" })))
      .toMatchObject({ destination: "SOS", agency: "state" });
    expect(panAmPropsForDeadline(deadline({ deadline_type: "unknown_kind" })))
      .toMatchObject({ destination: "BIZ", agency: "state" });
  });

  it("flips routing to X and topColor to red when overdue", () => {
    const p = panAmPropsForDeadline(deadline({ status: "overdue" }));
    expect(p.routing).toBe("X");
    expect(p.topColor).toBe("#C8102E");
    expect(p.routingMark).toBe(true);
    expect(p.stripLeft).toMatch(/ROUTE BLOCKED$/);
  });

  it("uses routing Z when compliant", () => {
    const p = panAmPropsForDeadline(deadline({ status: "compliant" }));
    expect(p.routing).toBe("Z");
    expect(p.topColor).toBeUndefined();
    expect(p.stripLeft).toMatch(/COMPLETED$/);
  });

  it("derives a hash-letter routing when active", () => {
    const p = panAmPropsForDeadline(deadline({ status: "upcoming" }));
    expect(p.routing).toMatch(/^[A-WY]$/);
  });

  it("encodes the due date in city", () => {
    const p = panAmPropsForDeadline(deadline({ due_date: "2026-09-30" }));
    expect(p.city).toBe("SEP · 30 · 2026");
  });

  it("encodes frequency in the form run stem suffix", () => {
    expect(panAmPropsForDeadline(deadline({ frequency: "quarterly", due_date: "2026-09-30" })).formRun?.c)
      .toBe("—Q3");
    expect(panAmPropsForDeadline(deadline({ frequency: "annual", due_date: "2026-04-15" })).formRun?.c)
      .toBe("—FY26");
    expect(panAmPropsForDeadline(deadline({ frequency: "one_time", due_date: "2026-07-04" })).formRun?.c)
      .toBe("—M07");
  });

  it("picks a form stem from the (type, frequency) matrix", () => {
    expect(panAmPropsForDeadline(deadline({ deadline_type: "tax", frequency: "quarterly" })).formRun?.b)
      .toBe("941");
    expect(panAmPropsForDeadline(deadline({ deadline_type: "tax", frequency: "annual" })).formRun?.b)
      .toBe("1120");
    expect(panAmPropsForDeadline(deadline({ deadline_type: "coi", frequency: "annual" })).formRun?.b)
      .toBe("ACORD25");
  });

  it("calms routingMark for low-severity upcoming items", () => {
    const p = panAmPropsForDeadline(
      deadline({ severity_tier: "low", status: "upcoming" })
    );
    expect(p.routingMark).toBe(false);
  });

  it("encodes the routing letter into the pressing code", () => {
    const p = panAmPropsForDeadline(deadline());
    expect(p.stripRight).toMatch(
      new RegExp(`^PTD\\. BY OPS / \\d{2}-\\d{2}/${p.routing}$`)
    );
  });
});
