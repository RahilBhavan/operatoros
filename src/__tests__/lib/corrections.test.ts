import { describe, it, expect } from "vitest";
import {
  validateProposedChanges,
  validateRationale,
  validateCitationUrl,
  confidenceLabel,
} from "@/lib/corrections";

describe("validateProposedChanges", () => {
  it("rejects non-object input", () => {
    expect(validateProposedChanges(null).ok).toBe(false);
    expect(validateProposedChanges("oops").ok).toBe(false);
    expect(validateProposedChanges([]).ok).toBe(false);
  });

  it("rejects an empty object", () => {
    const r = validateProposedChanges({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/no changes/i);
  });

  it("accepts a single name change", () => {
    const r = validateProposedChanges({ name: "Updated Name" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.name).toBe("Updated Name");
  });

  it("rejects empty required string", () => {
    const r = validateProposedChanges({ name: "" });
    expect(r.ok).toBe(false);
  });

  it("treats source_url + statute_citation as nullable", () => {
    const r = validateProposedChanges({ source_url: "", statute_citation: null });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.source_url).toBe("");
      expect(r.value.statute_citation).toBe("");
    }
  });

  it("validates severity_tier enum", () => {
    expect(validateProposedChanges({ severity_tier: "critical" }).ok).toBe(true);
    expect(validateProposedChanges({ severity_tier: "wrong" }).ok).toBe(false);
  });

  it("validates frequency enum", () => {
    expect(validateProposedChanges({ frequency: "annual" }).ok).toBe(true);
    expect(validateProposedChanges({ frequency: "fortnightly" }).ok).toBe(false);
  });

  it("requires penalty_estimate_cents to be a non-negative integer", () => {
    expect(validateProposedChanges({ penalty_estimate_cents: 5000 }).ok).toBe(true);
    expect(validateProposedChanges({ penalty_estimate_cents: -1 }).ok).toBe(false);
    expect(validateProposedChanges({ penalty_estimate_cents: 3.14 }).ok).toBe(false);
  });

  it("accepts ISO dates only", () => {
    expect(validateProposedChanges({ effective_date: "2026-01-01" }).ok).toBe(true);
    expect(validateProposedChanges({ effective_date: "Jan 1 2026" }).ok).toBe(false);
  });

  it("requires due_date_rule + applies_when to be objects", () => {
    expect(validateProposedChanges({ due_date_rule: { kind: "fixed" } }).ok).toBe(true);
    expect(validateProposedChanges({ due_date_rule: "fixed" }).ok).toBe(false);
    expect(validateProposedChanges({ applies_when: [] }).ok).toBe(false);
  });
});

describe("validateRationale", () => {
  it("requires at least 8 chars after trim", () => {
    expect(validateRationale("short").ok).toBe(false);
    expect(validateRationale("       a       ").ok).toBe(false);
    expect(validateRationale("plenty long").ok).toBe(true);
  });

  it("rejects non-strings", () => {
    expect(validateRationale(42).ok).toBe(false);
    expect(validateRationale(null).ok).toBe(false);
  });

  it("caps at 4000 chars", () => {
    expect(validateRationale("x".repeat(4000)).ok).toBe(true);
    expect(validateRationale("x".repeat(4001)).ok).toBe(false);
  });
});

describe("validateCitationUrl", () => {
  it("treats empty + null as no citation", () => {
    expect(validateCitationUrl(null)).toEqual({ ok: true, value: null });
    expect(validateCitationUrl("")).toEqual({ ok: true, value: null });
    expect(validateCitationUrl("   ")).toEqual({ ok: true, value: null });
  });

  it("rejects non-strings", () => {
    expect(validateCitationUrl(42).ok).toBe(false);
  });

  it("requires http(s) scheme", () => {
    expect(validateCitationUrl("https://www.irs.gov/x").ok).toBe(true);
    expect(validateCitationUrl("http://example.com").ok).toBe(true);
    expect(validateCitationUrl("ftp://example.com").ok).toBe(false);
    expect(validateCitationUrl("javascript:alert(1)").ok).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(validateCitationUrl("not-a-url").ok).toBe(false);
  });
});

describe("confidenceLabel", () => {
  it("maps every tier to a human label", () => {
    expect(confidenceLabel("low")).toBe("Disputed");
    expect(confidenceLabel("unverified")).toBe("Unverified");
    expect(confidenceLabel("stale")).toBe("Stale");
    expect(confidenceLabel("community_validated")).toBe("Verified by accountants");
    expect(confidenceLabel("baseline")).toBe("Baseline");
  });
});
