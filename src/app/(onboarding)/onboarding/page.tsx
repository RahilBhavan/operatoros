"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  Industry,
  EntityType,
  EmployeeRange,
  OnboardingData,
} from "@/types/onboarding";
import { employeeRangeToCount } from "@/lib/onboarding-utils";
import { buildStarterDeadlines } from "@/lib/seed-deadlines";
import {
  Destination,
  H2,
  Body,
  Caption,
  Utility,
  Index,
  Button,
} from "@/components/doctrine";

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
const SORT_LETTERS = ["A", "B", "C", "D", "E"] as const;

function ProgressLadder({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 h-2 border border-[var(--color-ground)] ${
            i < step ? "bg-[var(--color-mark)]" : "bg-transparent"
          }`}
          aria-label={`Step ${i + 1} ${i < step ? "complete" : "pending"}`}
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
          industry_slug: data.industry ?? undefined,
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

      const { error: locErr } = await supabase.from("locations").insert({
        business_id: business.id,
        state: data.state,
      });

      if (locErr) {
        setError("Failed to save location. Please try again.");
        return;
      }

      await seedStarterDeadlines(supabase, business.id, data);

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const sortLetter = SORT_LETTERS[step - 1];

  return (
    <div className="min-h-screen bg-[var(--color-field)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[600px]">
        <Link href="/" className="flex items-baseline gap-3 mb-10 justify-center">
          <span className="t-h1 font-black tracking-tight">
            OPERATOR<span className="text-[var(--color-mark)]">OS</span>
          </span>
        </Link>

        <div className="border-2 border-[var(--color-ground)]">
          <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-7 pt-6 pb-6">
            <div className="flex items-center justify-between mb-5">
              <Index className="!text-[12px] !text-[var(--color-field)] opacity-80">
                ONB-{String(step).padStart(2, "0")}/{String(TOTAL_STEPS).padStart(2, "0")}
              </Index>
              <span className="tag-tab -mt-6">ONBOARD</span>
              <Utility className="opacity-80">SORT · {sortLetter}</Utility>
            </div>
            <Utility className="!text-[var(--color-field)] !opacity-70 mb-2">
              STEP {step} OF {TOTAL_STEPS}
            </Utility>
            <ProgressLadder step={step} />
          </div>

          <div className="bg-[var(--color-field)] px-7 py-7">
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
              <div className="mt-5 border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-4 py-3">
                <Utility className="!opacity-100 mb-1">ERROR</Utility>
                <Body className="!text-[var(--color-field)] !text-[15px]">
                  {error}
                </Body>
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--color-ground)]">
              {step > 1 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="t-utility hover:text-[var(--color-mark)]"
                >
                  ← BACK
                </button>
              ) : (
                <div />
              )}

              {step < TOTAL_STEPS ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()} variant="ground">
                  Continue →
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={!canAdvance() || saving} variant="mark">
                  {saving ? "Building calendar…" : "Build my calendar →"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step sub-components ─────────────────────────────────────────────

function StepHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <Utility className="opacity-60 mb-2">{kicker}</Utility>
      <Destination className="!text-[38px] !leading-[1.0] mb-4">{title}</Destination>
    </>
  );
}

function StepBusinessName({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <StepHeading kicker="QUESTION 01" title="WHAT'S YOUR BUSINESS CALLED?" />
      <Body className="!opacity-70 mb-6">
        How your compliance calendar will be labeled.
      </Body>
      <input
        autoFocus
        type="text"
        placeholder="e.g. Joe's HVAC LLC"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="t-input !text-[19px]"
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
      <StepHeading kicker="QUESTION 02" title="WHAT INDUSTRY?" />
      <Body className="!opacity-70 mb-6">
        Determines which compliance deadlines apply to you.
      </Body>
      <div className="flex flex-col gap-2">
        {INDUSTRIES.map(({ value: v, label }, i) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`text-left px-4 py-3 border-2 transition-colors flex items-center gap-4 ${
              value === v
                ? "border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)]"
                : "border-[var(--color-ground)] hover:bg-[var(--color-field-soft)]"
            }`}
          >
            <Index className={`!text-[15px] shrink-0 ${value === v ? "!text-[var(--color-field)]" : ""}`}>
              {String(i + 1).padStart(2, "0")}
            </Index>
            <span className="t-body">{label}</span>
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
      <StepHeading kicker="QUESTION 03" title="WHERE DO YOU OPERATE?" />
      <Body className="!opacity-70 mb-6">
        State determines your entity filing and licensing requirements.
      </Body>
      <div className="flex flex-col gap-5">
        <div>
          <Utility className="block mb-2">PRIMARY STATE</Utility>
          <select
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            className="t-input"
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
          <Utility className="block mb-2">LEGAL ENTITY TYPE</Utility>
          <div className="grid grid-cols-2 gap-2">
            {ENTITY_TYPES.map(({ value: v, label }) => (
              <button
                key={v}
                onClick={() => onEntityChange(v)}
                className={`text-left px-4 py-2.5 border-2 transition-colors t-body ${
                  entityType === v
                    ? "border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)]"
                    : "border-[var(--color-ground)] hover:bg-[var(--color-field-soft)]"
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
      <StepHeading kicker="QUESTION 04" title="HOW MANY EMPLOYEES?" />
      <Body className="!opacity-70 mb-6">
        Affects OSHA, workers&apos; comp, and payroll deadlines.
      </Body>
      <div className="flex flex-col gap-2">
        {EMPLOYEE_RANGES.map(({ value: v, label }) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`text-left px-4 py-3 border-2 transition-colors flex items-center gap-4 ${
              value === v
                ? "border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)]"
                : "border-[var(--color-ground)] hover:bg-[var(--color-field-soft)]"
            }`}
          >
            <Index className={`!text-[15px] shrink-0 ${value === v ? "!text-[var(--color-field)]" : ""}`}>
              {v}
            </Index>
            <span className="t-body">{label}</span>
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
      <StepHeading kicker="QUESTION 05" title="HIRE CONTRACTORS?" />
      <Body className="!opacity-70 mb-6">
        If yes, we&apos;ll track COI and credential renewals for your subs.
      </Body>
      <div className="flex flex-col gap-3">
        {[
          {
            v: true,
            label: "Yes, I hire contractors",
            desc: "We'll track COI renewals, contractor license expiries, and subcontractor credentials.",
          },
          {
            v: false,
            label: "No, employees only",
            desc: "We'll focus on business licenses, employee certs, and entity filings.",
          },
        ].map(({ v, label, desc }) => (
          <button
            key={String(v)}
            onClick={() => onChange(v)}
            className={`text-left px-5 py-4 border-2 transition-colors ${
              value === v
                ? "border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)]"
                : "border-[var(--color-ground)] hover:bg-[var(--color-field-soft)]"
            }`}
          >
            <div className="t-subhead font-bold">{label}</div>
            <div className={`t-caption mt-1 ${value === v ? "!text-[var(--color-field)] !opacity-80" : ""}`}>
              {desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Deadline seeding ────────────────────────────────────────────────

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
