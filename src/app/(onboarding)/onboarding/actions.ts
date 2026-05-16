"use server";

import { createClient } from "@/lib/supabase/server";
import { employeeRangeToCount } from "@/lib/onboarding-utils";
import { buildStarterDeadlines } from "@/lib/seed-deadlines";
import { loadActiveRules, type RulesClient } from "@/lib/regulatory-graph";
import type {
  EmployeeRange,
  EntityType,
  Industry,
  OnboardingData,
} from "@/types/onboarding";

const INDUSTRY_VALUES: ReadonlySet<Industry> = new Set<Industry>([
  "restaurant",
  "construction",
  "healthcare",
  "retail",
  "personal_services",
  "business_services",
  "manufacturing",
  "transportation",
  "fitness",
  "other",
]);

const ENTITY_VALUES: ReadonlySet<EntityType> = new Set<EntityType>([
  "llc",
  "s_corp",
  "c_corp",
  "sole_proprietor",
  "partnership",
  "nonprofit",
]);

const EMPLOYEE_RANGES: ReadonlySet<EmployeeRange> = new Set<EmployeeRange>([
  "1",
  "2-5",
  "6-15",
  "16-30",
  "31-50",
]);

const US_STATES: ReadonlySet<string> = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
]);

export type CompleteOnboardingResult =
  | { ok: true; businessId: string }
  | { ok: false; error: string };

function validate(input: unknown): OnboardingData | { error: string } {
  if (!input || typeof input !== "object") {
    return { error: "Invalid input." };
  }
  const raw = input as Record<string, unknown>;

  const businessName = typeof raw.businessName === "string" ? raw.businessName.trim() : "";
  if (businessName.length === 0 || businessName.length > 200) {
    return { error: "Business name is required (1-200 characters)." };
  }

  const industry = raw.industry;
  if (industry !== null && (typeof industry !== "string" || !INDUSTRY_VALUES.has(industry as Industry))) {
    return { error: "Invalid industry selection." };
  }

  const state = typeof raw.state === "string" ? raw.state : "";
  if (!US_STATES.has(state)) {
    return { error: "Invalid state selection." };
  }

  const entityType = raw.entityType;
  if (entityType !== null && (typeof entityType !== "string" || !ENTITY_VALUES.has(entityType as EntityType))) {
    return { error: "Invalid entity type." };
  }

  const employeeRange = raw.employeeRange;
  if (employeeRange !== null && (typeof employeeRange !== "string" || !EMPLOYEE_RANGES.has(employeeRange as EmployeeRange))) {
    return { error: "Invalid employee range." };
  }

  const hiresContractors = raw.hiresContractors;
  if (hiresContractors !== null && typeof hiresContractors !== "boolean") {
    return { error: "Invalid contractor selection." };
  }

  return {
    businessName,
    industry: (industry as Industry | null) ?? null,
    state,
    entityType: (entityType as EntityType | null) ?? null,
    employeeRange: (employeeRange as EmployeeRange | null) ?? null,
    hiresContractors: (hiresContractors as boolean | null) ?? null,
  };
}

export async function completeOnboarding(
  input: unknown
): Promise<CompleteOnboardingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const parsed = validate(input);
  if ("error" in parsed) {
    return { ok: false, error: parsed.error };
  }

  const data = parsed;

  // Load the live rule graph from the DB (cached 10 min in-process,
  // falls back to LEGACY_RULES if the table is unreachable or empty).
  // This is the bridge that lets admin edits / accepted corrections /
  // newly-seeded rules flow into onboarding without a redeploy.
  const { rules } = await loadActiveRules({
    client: supabase as unknown as RulesClient,
  });

  // Build the seed array with a placeholder business_id; the RPC ignores
  // the field and uses the row it inserts/finds itself. Including the field
  // keeps DeadlineSeed's shape stable for the existing call sites.
  const seeds = buildStarterDeadlines(data, "placeholder", undefined, rules);

  const rpcPayload = {
    p_business: {
      name: data.businessName,
      industry_slug: data.industry,
      entity_type: data.entityType,
      employee_count: employeeRangeToCount(data.employeeRange),
      hires_contractors: data.hiresContractors ?? false,
    },
    p_location: {
      state: data.state,
    },
    p_seeds: seeds,
  };

  // RPC types are regenerated via `bun run db:types` after the migration
  // deploys. Cast at the call site so the rest of the file stays type-checked.
  const rpcClient = supabase.rpc as unknown as (
    fn: "complete_onboarding",
    params: typeof rpcPayload
  ) => Promise<{ data: string | null; error: { code?: string; message: string } | null }>;
  const { data: businessId, error } = await rpcClient("complete_onboarding", rpcPayload);

  if (error || !businessId) {
    if (error?.code === "42501") {
      return { ok: false, error: "Sign in again to finish onboarding." };
    }
    return { ok: false, error: "Could not save your onboarding. Try again." };
  }

  return { ok: true, businessId: String(businessId) };
}
