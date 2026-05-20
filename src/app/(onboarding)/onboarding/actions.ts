"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { employeeRangeToCount } from "@/lib/onboarding-utils";
import { buildStarterDeadlines } from "@/lib/seed-deadlines";
import { loadActiveRules, type RulesClient } from "@/lib/regulatory-graph";
import {
  INVITE_CODE_COOKIE,
  incrementInviteLinkCounter,
  loadActiveInviteLink,
} from "@/lib/viral-attribution";
import { track } from "@/lib/analytics";
import type {
  EmployeeRange,
  EntityType,
  Industry,
  IntendedPlan,
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

  const intendedPlan = raw.intendedPlan;
  if (
    intendedPlan !== null &&
    intendedPlan !== undefined &&
    intendedPlan !== "business" &&
    intendedPlan !== "accountant"
  ) {
    return { error: "Invalid plan selection." };
  }

  return {
    businessName,
    industry: (industry as Industry | null) ?? null,
    state,
    entityType: (entityType as EntityType | null) ?? null,
    employeeRange: (employeeRange as EmployeeRange | null) ?? null,
    hiresContractors: (hiresContractors as boolean | null) ?? null,
    intendedPlan: (intendedPlan as IntendedPlan | null) ?? null,
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
  const rpcClient = supabase.rpc.bind(supabase) as unknown as (
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

  // Persist intended plan separately from the RPC (the RPC predates the
  // intended_plan column; widening it requires a function migration). This
  // is intent, not entitlement — plan_tier stays 'free' until Stripe webhook
  // flips it after subscription creation.
  if (data.intendedPlan) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("businesses") as any)
        .update({ intended_plan: data.intendedPlan })
        .eq("id", String(businessId));
    } catch (err) {
      // Non-fatal — the user can still pick a plan on /billing.
      console.warn("[onboarding] intended_plan persist skipped", {
        business_id: String(businessId),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  let attributedToAccountantId: string | null = null;

  // WS-D — viral attribution. If the visitor arrived via /i/<code>, persist
  // the attribution on the new business row and increment the link's signups
  // counter. Fire-and-forget on each step: a failure here must not block
  // onboarding success.
  try {
    const cookieStore = await cookies();
    const inviteCookie = cookieStore.get(INVITE_CODE_COOKIE)?.value;
    if (inviteCookie) {
      const admin = createAdminClient();
      const link = await loadActiveInviteLink(admin, inviteCookie);
      if (link) {
        await admin
          .from("businesses")
          .update({
            invited_by_accountant_id: link.accountant_id,
            invite_code: link.code,
          })
          .eq("id", String(businessId));
        await incrementInviteLinkCounter(admin, link.id, "signups_count");
        attributedToAccountantId = link.accountant_id;
        // WS-E — analytics signal that an invited signup landed.
        void track({
          distinctId: user.id,
          event: "invite_link_signup",
          properties: {
            business_id: String(businessId),
            accountant_id: link.accountant_id,
            invite_code: link.code,
          },
        });
      }
      // Clear the cookie either way — it's single-use and revoked codes
      // should not linger.
      cookieStore.set(INVITE_CODE_COOKIE, "", {
        path: "/",
        maxAge: 0,
      });
    }
  } catch (err) {
    console.warn("[onboarding] viral attribution skipped", {
      business_id: String(businessId),
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // WS-E — onboarding completion is one of the four canonical funnel steps.
  void track({
    distinctId: user.id,
    event: "onboarding_completed",
    properties: {
      business_id: String(businessId),
      industry_slug: data.industry,
      state: data.state,
      entity_type: data.entityType,
      employee_range: data.employeeRange,
      attributed: Boolean(attributedToAccountantId),
    },
  });

  return { ok: true, businessId: String(businessId) };
}
