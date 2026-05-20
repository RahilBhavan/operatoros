"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  Industry,
  EntityType,
  EmployeeRange,
  IntendedPlan,
  OnboardingData,
} from "@/types/onboarding";
import { Button } from "@/components/doctrine/Button";
import { StampChip } from "@/components/doctrine/StampChip";
import { FormField } from "@/components/doctrine/FormField";
import { Wordmark } from "@/components/doctrine/Wordmark";
import { completeOnboarding } from "./actions";

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

const EMPLOYEE_RANGES: { value: EmployeeRange; label: string; sub: string }[] = [
  { value: "1", label: "Just me", sub: "Sole proprietor" },
  { value: "2-5", label: "2 — 5", sub: "Micro team" },
  { value: "6-15", label: "6 — 15", sub: "OSHA reporting triggers begin" },
  { value: "16-30", label: "16 — 30", sub: "Multi-state payroll likely" },
  { value: "31-50", label: "31 — 50", sub: "Workers' comp audits annual" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const TOTAL_STEPS = 6;
const STEP_LABELS = ["Business", "Industry", "Location", "Employees", "Contractors", "Plan"] as const;

function ProgressLadder({ step }: { step: number }) {
  return (
    <div className="flex items-stretch gap-1.5">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          aria-label={`Step ${i + 1} ${i < step ? "complete" : "pending"}`}
          className={`flex-1 h-2 border-2 border-[var(--color-ground)] ${
            i < step ? "bg-[var(--color-ground)]" : "bg-transparent"
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
    intendedPlan: "business",
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
    if (step === 6) return data.intendedPlan !== null;
    return false;
  }

  async function handleFinish() {
    setSaving(true);
    setError("");

    try {
      const result = await completeOnboarding(data);
      if (!result.ok) {
        if (result.error === "Not signed in.") {
          router.push("/sign-in");
          return;
        }
        setError(result.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-field)] flex flex-col">
      <header className="border-t-4 border-[var(--color-ground)] border-b border-[var(--color-ground)] px-6 py-4">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between">
          <Wordmark size={20} />
          <span className="t-utility text-[var(--color-ground)]">
            Build your compliance calendar
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-5">
        <div className="w-full max-w-[680px]">
          <ProgressLadder step={step} />

          <div className="flex items-center justify-between mt-6 mb-4">
            <span className="t-utility text-[var(--color-ground)]">
              Step {String(step).padStart(2, "0")} / {String(TOTAL_STEPS).padStart(2, "0")}
            </span>
            <StampChip tone="ground">{STEP_LABELS[step - 1]}</StampChip>
          </div>

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
          {step === 6 && (
            <StepPlan
              value={data.intendedPlan ?? null}
              onChange={(v) => update("intendedPlan", v)}
              industry={data.industry}
            />
          )}

          {error ? (
            <div className="mt-6 border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-4 py-3">
              <div
                className="t-utility mb-1"
                style={{ color: "var(--color-field)" }}
              >
                Error
              </div>
              <p
                className="text-[14px]"
                style={{
                  fontFamily: "var(--font-index)",
                  color: "var(--color-field)",
                }}
              >
                {error}
              </p>
            </div>
          ) : null}

          <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-[var(--color-ground)]">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="t-utility text-[var(--color-ground)] hover:text-[var(--color-mark)]"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}

            {step < TOTAL_STEPS ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
                variant="ground"
              >
                Continue →
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={!canAdvance() || saving}
                variant="mark"
                size="lg"
              >
                {saving ? "Building calendar…" : "Build my calendar →"}
              </Button>
            )}
          </div>

          <div className="mt-6 t-utility text-[var(--color-ground)]">
            <Link href="/" className="t-link">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1
        style={{
          fontFamily: "var(--font-destination)",
          fontWeight: 900,
          fontSize: 44,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
          color: "var(--color-ground)",
        }}
      >
        {title}
      </h1>
      <p
        className="mt-4 text-[17px]"
        style={{ fontFamily: "var(--font-index)", color: "var(--color-ground)" }}
      >
        {subtitle}
      </p>
    </div>
  );
}

function OptionRow({
  active,
  onClick,
  code,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  code?: string;
  label: string;
  sub?: string;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`text-left w-full flex items-center gap-4 px-4 py-4 border-2 border-[var(--color-ground)] -mb-[2px] ${
        active
          ? "bg-[var(--color-ground)] text-[var(--color-field)]"
          : "bg-[var(--color-field)] text-[var(--color-ground)] hover:bg-[var(--color-ground)] hover:text-[var(--color-field)]"
      }`}
    >
      {code ? (
        <span
          className="t-utility shrink-0 w-12"
          style={{ color: "inherit" }}
        >
          {code}
        </span>
      ) : null}
      <div className="flex-1 min-w-0">
        <div
          className="text-[16px] font-bold"
          style={{ fontFamily: "var(--font-index)" }}
        >
          {label}
        </div>
        {sub ? (
          <div className="t-utility mt-1" style={{ color: "inherit" }}>
            {sub}
          </div>
        ) : null}
      </div>
    </button>
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
      <StepHeading
        title="What's the business called?"
        subtitle="It will appear on every compliance export."
      />
      <FormField label="Business name" htmlFor="business-name">
        <input
          id="business-name"
          autoFocus
          type="text"
          placeholder="e.g. Joe's HVAC LLC"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="t-input"
        />
      </FormField>
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
      <StepHeading
        title="What industry?"
        subtitle="This determines which deadlines apply to you."
      />
      <div className="border-t-2 border-[var(--color-ground)]">
        {INDUSTRIES.map((opt, i) => (
          <OptionRow
            key={opt.value}
            active={value === opt.value}
            onClick={() => onChange(opt.value)}
            code={String(i + 1).padStart(2, "0")}
            label={opt.label}
          />
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
      <StepHeading
        title="Where do you operate?"
        subtitle="State and entity type set the entity-filing and licensing requirements."
      />
      <div className="flex flex-col gap-6">
        <FormField label="Primary state" htmlFor="state">
          <select
            id="state"
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
        </FormField>
        <FormField label="Legal entity type">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 border-2 border-[var(--color-ground)]">
            {ENTITY_TYPES.map((opt, i) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onEntityChange(opt.value)}
                className={`px-4 py-3 t-utility border-[var(--color-ground)] ${
                  i % 3 < 2 ? "border-r-2" : ""
                } ${i < 3 ? "border-b-2" : ""} ${
                  entityType === opt.value
                    ? "bg-[var(--color-ground)] text-[var(--color-field)]"
                    : "bg-[var(--color-field)] text-[var(--color-ground)] hover:bg-[var(--color-ground)] hover:text-[var(--color-field)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FormField>
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
      <StepHeading
        title="How many employees?"
        subtitle="Headcount triggers OSHA, payroll, and workers' comp deadlines."
      />
      <div className="border-t-2 border-[var(--color-ground)]">
        {EMPLOYEE_RANGES.map((opt) => (
          <OptionRow
            key={opt.value}
            active={value === opt.value}
            onClick={() => onChange(opt.value)}
            code={opt.value}
            label={opt.label}
            sub={opt.sub}
          />
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
  const opts = [
    {
      v: true,
      label: "Yes, I hire contractors",
      sub: "We'll track COI renewals, contractor license expiries, and sub credentials.",
    },
    {
      v: false,
      label: "No, employees only",
      sub: "We'll focus on business licenses, employee certs, and entity filings.",
    },
  ];
  return (
    <div>
      <StepHeading
        title="Do you hire contractors?"
        subtitle="If yes, we route COI and credential renewals for your subs."
      />
      <div className="border-t-2 border-[var(--color-ground)]">
        {opts.map((opt) => (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(opt.v)}
            className={`text-left w-full px-5 py-5 border-2 border-[var(--color-ground)] -mb-[2px] ${
              value === opt.v
                ? "bg-[var(--color-ground)] text-[var(--color-field)]"
                : "bg-[var(--color-field)] text-[var(--color-ground)] hover:bg-[var(--color-ground)] hover:text-[var(--color-field)]"
            }`}
          >
            <div
              className="text-[20px] font-bold mb-1"
              style={{
                fontFamily: "var(--font-destination)",
                textTransform: "uppercase",
                letterSpacing: "-0.005em",
              }}
            >
              {opt.label}
            </div>
            <div
              className="text-[14px]"
              style={{ fontFamily: "var(--font-index)" }}
            >
              {opt.sub}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepPlan({
  value,
  onChange,
  industry,
}: {
  value: IntendedPlan | null;
  onChange: (v: IntendedPlan) => void;
  industry: Industry | null;
}) {
  const isAccountantLeaning = industry === "business_services";
  const opts: { v: IntendedPlan; label: string; price: string; sub: string; rec: boolean }[] = [
    {
      v: "business",
      label: "Business · $79/mo",
      price: "B-079",
      sub: "For operators tracking their own compliance. AI insights, share link, accountant portal, up to 5 team members.",
      rec: !isAccountantLeaning,
    },
    {
      v: "accountant",
      label: "Accountant · $299/mo",
      price: "A-299",
      sub: "For CPAs and bookkeepers managing 5+ client portfolios. Bulk onboarding, white-labeled reports, per-client dashboards.",
      rec: isAccountantLeaning,
    },
  ];
  return (
    <div>
      <StepHeading
        title="Pick your plan."
        subtitle="14-day free trial — no card needed. You'll start checkout later from the billing page."
      />
      <div className="border-t-2 border-[var(--color-ground)]">
        {opts.map((opt) => (
          <button
            key={opt.v}
            type="button"
            onClick={() => onChange(opt.v)}
            className={`text-left w-full px-5 py-5 border-2 border-[var(--color-ground)] -mb-[2px] flex items-start justify-between gap-4 ${
              value === opt.v
                ? "bg-[var(--color-ground)] text-[var(--color-field)]"
                : "bg-[var(--color-field)] text-[var(--color-ground)] hover:bg-[var(--color-ground)] hover:text-[var(--color-field)]"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div
                className="text-[20px] font-bold mb-1"
                style={{
                  fontFamily: "var(--font-destination)",
                  textTransform: "uppercase",
                  letterSpacing: "-0.005em",
                }}
              >
                {opt.label}
              </div>
              <div
                className="text-[14px]"
                style={{ fontFamily: "var(--font-index)" }}
              >
                {opt.sub}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {opt.rec ? (
                <span
                  className="t-utility !text-[10px] border-2 px-2 py-0.5"
                  style={
                    value === opt.v
                      ? {
                          borderColor: "var(--color-field)",
                          color: "var(--color-field)",
                        }
                      : {
                          borderColor: "var(--color-mark)",
                          background: "var(--color-mark)",
                          color: "var(--color-field)",
                        }
                  }
                >
                  RECOMMENDED
                </span>
              ) : null}
              <span
                className="t-index !text-[12px] tabular-nums"
                style={
                  value === opt.v
                    ? { color: "var(--color-field)" }
                    : undefined
                }
              >
                {opt.price}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
