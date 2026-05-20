export type Industry =
  | "restaurant"
  | "construction"
  | "healthcare"
  | "retail"
  | "personal_services"
  | "business_services"
  | "manufacturing"
  | "transportation"
  | "fitness"
  | "other";

export type EntityType =
  | "llc"
  | "s_corp"
  | "c_corp"
  | "sole_proprietor"
  | "partnership"
  | "nonprofit";

export type EmployeeRange = "1" | "2-5" | "6-15" | "16-30" | "31-50";

export type IntendedPlan = "business" | "accountant";

export interface OnboardingData {
  businessName: string;
  industry: Industry | null;
  state: string;
  entityType: EntityType | null;
  employeeRange: EmployeeRange | null;
  hiresContractors: boolean | null;
  // Optional — only set by the in-flow plan picker; the RPC and seed
  // builder ignore it.
  intendedPlan?: IntendedPlan | null;
}
