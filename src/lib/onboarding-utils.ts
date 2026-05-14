import type { EmployeeRange } from "@/types/onboarding";

const EMPLOYEE_RANGE_TO_COUNT: Record<EmployeeRange, number> = {
  "1": 1,
  "2-5": 3,
  "6-15": 10,
  "16-30": 20,
  "31-50": 40,
};

export function employeeRangeToCount(range: EmployeeRange | null): number | null {
  return range ? EMPLOYEE_RANGE_TO_COUNT[range] : null;
}

export const MULTI_EMPLOYEE_RANGES: EmployeeRange[] = ["6-15", "16-30", "31-50"];

export function requiresOshaLog(range: EmployeeRange | null): boolean {
  return range !== null && MULTI_EMPLOYEE_RANGES.includes(range);
}
