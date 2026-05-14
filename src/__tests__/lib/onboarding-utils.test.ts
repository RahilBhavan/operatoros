import { describe, it, expect } from "vitest";
import { employeeRangeToCount, requiresOshaLog } from "@/lib/onboarding-utils";
import type { EmployeeRange } from "@/types/onboarding";

describe("employeeRangeToCount", () => {
  it("returns null for null input", () => {
    expect(employeeRangeToCount(null)).toBeNull();
  });

  it("maps '1' to 1", () => {
    expect(employeeRangeToCount("1")).toBe(1);
  });

  it("maps '2-5' to 3", () => {
    expect(employeeRangeToCount("2-5")).toBe(3);
  });

  it("maps '6-15' to 10", () => {
    expect(employeeRangeToCount("6-15")).toBe(10);
  });

  it("maps '16-30' to 20", () => {
    expect(employeeRangeToCount("16-30")).toBe(20);
  });

  it("maps '31-50' to 40", () => {
    expect(employeeRangeToCount("31-50")).toBe(40);
  });

  it("covers all EmployeeRange values", () => {
    const ranges: EmployeeRange[] = ["1", "2-5", "6-15", "16-30", "31-50"];
    for (const r of ranges) {
      expect(employeeRangeToCount(r)).toBeTypeOf("number");
    }
  });
});

describe("requiresOshaLog", () => {
  it("returns false for null", () => {
    expect(requiresOshaLog(null)).toBe(false);
  });

  it("returns false for '1' (sole proprietor)", () => {
    expect(requiresOshaLog("1")).toBe(false);
  });

  it("returns false for '2-5'", () => {
    expect(requiresOshaLog("2-5")).toBe(false);
  });

  it("returns true for '6-15'", () => {
    expect(requiresOshaLog("6-15")).toBe(true);
  });

  it("returns true for '16-30'", () => {
    expect(requiresOshaLog("16-30")).toBe(true);
  });

  it("returns true for '31-50'", () => {
    expect(requiresOshaLog("31-50")).toBe(true);
  });
});
