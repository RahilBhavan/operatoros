"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  Industry,
  EntityType,
  EmployeeRange,
  OnboardingData,
} from "@/types/onboarding";
import { employeeRangeToCount } from "@/lib/onboarding-utils";
import { buildStarterDeadlines } from "@/lib/seed-deadlines";

const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: "restaurant", label: "Restaurant / Food Service" },
  { value: "construction", label: "Construction / Trades (GC, HVAC, Plumbing, Electric)" },
  { value: "healthcare", label: "Healthcare / Professional Services" },
  { value: "retail", label: "Retail (Brick-and-Mortar)" },
  { value: "personal_services", label: "Personal Services (Salons, Auto, Cleaners)" },
  { value: "business_services", label: "Business Services (Accounting, Legal, Staffing)" },
  { value: "manufacturing", label: "Manufacturing / Light Industrial" },
  { value: "transportation", label: "Transportation / Logistics" },
  { value: "fitness", label: "Fitness / Wellness" },
  { value: "other", label: "Other" },
];

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: "llc", label: "LLC" },
  { value: "s_corp", label: "S-Corp" },
  { value: "c_corp", label: "C-Corp" },
  { value: "sole_proprietor", label: "Sole Proprietor" },
  { value: "partnership", label: "Partnership" },
  { value: "nonprofit", label: "Nonprofit" },
];

const EMPLOYEE_RANGES: { value: EmployeeRange; label: string }[] = [
  { value: "1", label: "Just me (sole proprietor)" },
  { value: "2-5", label: "2–5 employees" },
  { value: "6-15", label: "6–15 employees" },
  { value: "16-30", label: "16–30 employees" },
  { value: "31-50", label: "31–50 employees" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const TOTAL_STEPS = 5;

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full flex-1 transition-colors ${
            i < step ? "bg-blue-600" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [data, setData] = useState<OnboardingData>({
    businessName: "",
    industry: null,
    state: "",
    entityType: null,
    employeeRange: null,
    hiresContractors: null,
  });

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function canAdvance(): boolean {
    if (step === 1) return data.businessName.trim().length > 0;
    if (step === 2) return data.industry !== null;
    if (step === 3) return data.state.length > 0 && data.entityType !== null;
    if (step === 4) return data.employeeRange !== null;
    if (step === 5) return data.hiresContractors !== null;
    return false;
  }

  async function handleFinish() {
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in");
        return;
      }

      const { data: business, error: bizErr } = await supabase
        .from("businesses")
        .insert({
          owner_id: user.id,
          name: data.businessName.trim(),
          industry_sic_code: data.industry ?? undefined,
          entity_type: data.entityType ?? undefined,
          employee_count: employeeRangeToCount(data.employeeRange),
          hires_contractors: data.hiresContractors ?? false,
          onboarding_complete: true,
        })
        .select("id")
        .single();

      if (bizErr || !business) {
        setError("Failed to save your business. Please try again.");
        return;
      }

      // Create the primary location
      const { error: locErr } = await supabase.from("locations").insert({
        business_id: business.id,
        state: data.state,
      });

      if (locErr) {
        setError("Failed to save location. Please try again.");
        return;
      }

      // Seed starter deadlines based on industry/entity type
      await seedStarterDeadlines(supabase, business.id, data);

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Shield className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-xl text-slate-900">OperatorOS</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <ProgressBar step={step} />

          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
            Step {step} of {TOTAL_STEPS}
          </p>

          {step === 1 && (
            <StepBusinessName
              value={data.businessName}
              onChange={(v) => update("businessName", v)}
            />
          )}
          {step === 2 && (
            <StepIndustry
              value={data.industry}
              onChange={(v) => update("industry", v)}
            />
          )}
          {step === 3 && (
            <StepLocation
              state={data.state}
              entityType={data.entityType}
              onStateChange={(v) => update("state", v)}
              onEntityChange={(v) => update("entityType", v)}
            />
          )}
          {step === 4 && (
            <StepEmployees
              value={data.employeeRange}
              onChange={(v) => update("employeeRange", v)}
            />
          )}
          {step === 5 && (
            <StepContractors
              value={data.hiresContractors}
              onChange={(v) => update("hiresContractors", v)}
            />
          )}

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!canAdvance() || saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                {saving ? "Setting up..." : "Build my calendar"}
                {!saving && <Check className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step sub-components ────────────────────────────────────────────────────

function StepBusinessName({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        What&apos;s your business called?
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        This is how your compliance calendar will be labeled.
      </p>
      <input
        autoFocus
        type="text"
        placeholder="e.g. Joe's HVAC LLC"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 text-lg"
      />
    </div>
  );
}

function StepIndustry({
  value,
  onChange,
}: {
  value: Industry | null;
  onChange: (v: Industry) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        What industry are you in?
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        This determines which compliance deadlines apply to you.
      </p>
      <div className="flex flex-col gap-2">
        {INDUSTRIES.map(({ value: v, label }) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`text-left px-4 py-3 rounded-xl border-2 transition-colors text-sm font-medium ${
              value === v
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-200 hover:border-slate-300 text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepLocation({
  state,
  entityType,
  onStateChange,
  onEntityChange,
}: {
  state: string;
  entityType: EntityType | null;
  onStateChange: (v: string) => void;
  onEntityChange: (v: EntityType) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Where do you operate?
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        State determines your entity filing and licensing requirements.
      </p>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Primary state
          </label>
          <select
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
          >
            <option value="">Select a state…</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Legal entity type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ENTITY_TYPES.map(({ value: v, label }) => (
              <button
                key={v}
                onClick={() => onEntityChange(v)}
                className={`text-left px-4 py-2.5 rounded-xl border-2 transition-colors text-sm font-medium ${
                  entityType === v
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepEmployees({
  value,
  onChange,
}: {
  value: EmployeeRange | null;
  onChange: (v: EmployeeRange) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        How many employees do you have?
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        Employee count affects OSHA, workers&apos; comp, and payroll deadlines.
      </p>
      <div className="flex flex-col gap-2">
        {EMPLOYEE_RANGES.map(({ value: v, label }) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`text-left px-4 py-3 rounded-xl border-2 transition-colors text-sm font-medium ${
              value === v
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-200 hover:border-slate-300 text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepContractors({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Do you hire contractors or subcontractors?
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        If yes, we&apos;ll track COI and credential renewals for your subs.
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => onChange(true)}
          className={`text-left px-5 py-4 rounded-xl border-2 transition-colors ${
            value === true
              ? "border-blue-600 bg-blue-50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="font-semibold text-slate-900">
            Yes, I hire contractors
          </div>
          <div className="text-sm text-slate-500 mt-0.5">
            We&apos;ll track COI renewals, contractor license expiries, and
            subcontractor credentials.
          </div>
        </button>
        <button
          onClick={() => onChange(false)}
          className={`text-left px-5 py-4 rounded-xl border-2 transition-colors ${
            value === false
              ? "border-blue-600 bg-blue-50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="font-semibold text-slate-900">
            No, employees only
          </div>
          <div className="text-sm text-slate-500 mt-0.5">
            We&apos;ll focus on business licenses, employee certs, and entity
            filings.
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

type SupabaseClient = ReturnType<typeof createClient>;

async function seedStarterDeadlines(
  supabase: SupabaseClient,
  businessId: string,
  data: OnboardingData
) {
  const deadlines = buildStarterDeadlines(data, businessId);
  if (deadlines.length > 0) {
    await supabase.from("deadlines").insert(deadlines);
  }
}

