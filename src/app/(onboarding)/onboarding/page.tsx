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
import { formatIsoDate } from "@/lib/deadline-utils";
import { employeeRangeToCount, requiresOshaLog } from "@/lib/onboarding-utils";

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

// Returns the next future date for a given month (0-indexed) and day
function nextDate(month: number, day: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(today.getFullYear(), month, day);
  if (candidate <= today) candidate.setFullYear(candidate.getFullYear() + 1);
  return candidate;
}

// Returns the next N quarterly 941 due dates (Apr 30, Jul 31, Oct 31, Jan 31)
function next941Dates(n: number): Date[] {
  const quarterEnds = [
    [3, 30], // Q1 → April 30
    [6, 31], // Q2 → July 31
    [9, 31], // Q3 → October 31
    [0, 31], // Q4 → January 31
  ];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidates: Date[] = [];
  for (let year = today.getFullYear(); candidates.length < n; year++) {
    for (const [m, d] of quarterEnds) {
      const dt = new Date(year, m, d);
      if (dt > today) candidates.push(dt);
      if (candidates.length >= n) break;
    }
  }
  return candidates;
}

type DeadlineSeed = {
  business_id: string;
  name: string;
  description: string;
  deadline_type: string;
  governing_agency: string;
  frequency: string;
  due_date: string;
  source: string;
};

async function seedStarterDeadlines(
  supabase: SupabaseClient,
  businessId: string,
  data: OnboardingData
) {
  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const hasEmployees = data.employeeRange !== null && data.employeeRange !== "1";

  const deadlines: DeadlineSeed[] = [];

  function push(d: Omit<DeadlineSeed, "business_id" | "source">) {
    deadlines.push({ ...d, business_id: businessId, source: "discovery_agent" });
  }

  // ── Entity filing ──────────────────────────────────────────────────────────
  if (data.entityType && ["llc", "s_corp", "c_corp"].includes(data.entityType)) {
    push({
      name: `${data.state} Annual Report / Entity Filing`,
      description: `Annual state entity report for ${data.entityType.toUpperCase()} in ${data.state}. Failure to file can result in administrative dissolution.`,
      deadline_type: "entity_filing",
      governing_agency: `${data.state} Secretary of State`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
    });
  }

  // ── Business license ───────────────────────────────────────────────────────
  const licenseDate = new Date(today);
  licenseDate.setMonth(licenseDate.getMonth() + 11);
  push({
    name: "Business License Renewal",
    description: "City/county general business operating license renewal. Verify exact due date with your local licensing office.",
    deadline_type: "business_license",
    governing_agency: "City / County Business Office",
    frequency: "annual",
    due_date: formatIsoDate(licenseDate),
  });

  // ── Federal income tax return ──────────────────────────────────────────────
  if (data.entityType === "s_corp" || data.entityType === "partnership") {
    push({
      name: "Federal Business Tax Return (Form 1120-S / 1065)",
      description: "S-Corp and partnership federal income tax return due March 15. File Form 7004 for a 6-month extension.",
      deadline_type: "tax_filing",
      governing_agency: "IRS",
      frequency: "annual",
      due_date: formatIsoDate(nextDate(2, 15)), // March 15
    });
  } else if (data.entityType === "c_corp") {
    push({
      name: "Federal Corporate Tax Return (Form 1120)",
      description: "C-Corp federal income tax return due April 15. File Form 7004 for a 6-month extension.",
      deadline_type: "tax_filing",
      governing_agency: "IRS",
      frequency: "annual",
      due_date: formatIsoDate(nextDate(3, 15)), // April 15
    });
  } else {
    // LLC single-member / sole proprietor → Schedule C
    push({
      name: "Federal Income Tax Return (Schedule C / 1040)",
      description: "Individual federal income tax return including business income. Due April 15.",
      deadline_type: "tax_filing",
      governing_agency: "IRS",
      frequency: "annual",
      due_date: formatIsoDate(nextDate(3, 15)), // April 15
    });
  }

  // ── Quarterly estimated taxes (non-withheld income) ────────────────────────
  if (data.entityType !== "c_corp") {
    const estTaxDates = [
      { month: 3, day: 15, label: "Q1" },  // April 15
      { month: 5, day: 17, label: "Q2" },  // June 17
      { month: 8, day: 16, label: "Q3" },  // September 16
      { month: 0, day: 15, label: "Q4" },  // January 15
    ];
    for (const { month, day, label } of estTaxDates) {
      const dt = nextDate(month, day);
      // Only seed if within the next 12 months
      const twelveMonths = new Date(today);
      twelveMonths.setFullYear(twelveMonths.getFullYear() + 1);
      if (dt <= twelveMonths) {
        push({
          name: `Federal Estimated Tax Payment — ${label}`,
          description: `IRS quarterly estimated tax payment (Form 1040-ES). Required if you expect to owe $1,000+ in taxes. ${label} payment due.`,
          deadline_type: "tax_filing",
          governing_agency: "IRS",
          frequency: "quarterly",
          due_date: formatIsoDate(dt),
        });
      }
    }
  }

  // ── Payroll tax deadlines (businesses with employees) ─────────────────────
  if (hasEmployees) {
    const dates941 = next941Dates(2);
    for (const dt of dates941) {
      push({
        name: "Quarterly Payroll Tax Filing (Form 941)",
        description: "IRS Form 941 — quarterly payroll tax return reporting employee wages, tips, and federal withholding. Late filing penalty: 5% per month.",
        deadline_type: "tax_filing",
        governing_agency: "IRS",
        frequency: "quarterly",
        due_date: formatIsoDate(dt),
      });
    }

    push({
      name: "Annual FUTA Tax Return (Form 940)",
      description: "IRS Form 940 — annual Federal Unemployment Tax Act return. Due January 31. Deposit may be required quarterly if FUTA liability exceeds $500.",
      deadline_type: "tax_filing",
      governing_agency: "IRS",
      frequency: "annual",
      due_date: formatIsoDate(nextDate(0, 31)), // January 31
    });

    push({
      name: "W-2 / 1099 Filing Deadline",
      description: "File W-2s with SSA and distribute to employees by January 31. File 1099-NEC forms for contractors paid $600+.",
      deadline_type: "tax_filing",
      governing_agency: "IRS / SSA",
      frequency: "annual",
      due_date: formatIsoDate(nextDate(0, 31)), // January 31
    });

    const wcDate = new Date(today);
    wcDate.setMonth(wcDate.getMonth() + 10);
    push({
      name: "Workers' Compensation Insurance Renewal",
      description: "Annual workers' comp policy renewal. Required by law in most states for businesses with employees. Verify your policy expiry date.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Workers' Comp Board`,
      frequency: "annual",
      due_date: formatIsoDate(wcDate),
    });
  }

  // ── OSHA 300 Log (6+ employees) ───────────────────────────────────────────
  if (requiresOshaLog(data.employeeRange)) {
    push({
      name: "OSHA 300 Log — Annual Summary Posting",
      description: "Post the OSHA 300A annual summary of work-related injuries and illnesses from Feb 1 – Apr 30.",
      deadline_type: "equipment_inspection",
      governing_agency: "OSHA (Federal / State)",
      frequency: "annual",
      due_date: formatIsoDate(new Date(today.getFullYear() + 1, 1, 1)),
    });
  }

  // ── 1099-NEC (contractor-hiring businesses) ───────────────────────────────
  if (data.hiresContractors) {
    push({
      name: "1099-NEC Filing for Contractors",
      description: "File 1099-NEC forms with the IRS and send copies to all contractors paid $600+ during the year. Due January 31.",
      deadline_type: "tax_filing",
      governing_agency: "IRS",
      frequency: "annual",
      due_date: formatIsoDate(nextDate(0, 31)),
    });
  }

  // ── Industry: Restaurant ──────────────────────────────────────────────────
  if (data.industry === "restaurant") {
    const healthDate = new Date(today);
    healthDate.setMonth(healthDate.getMonth() + 6);
    push({
      name: "Food Service / Health Permit Renewal",
      description: "Annual food service establishment permit required by your local health department.",
      deadline_type: "business_license",
      governing_agency: "County Health Department",
      frequency: "annual",
      due_date: formatIsoDate(healthDate),
    });
    push({
      name: "Food Handler Certifications (Staff)",
      description: "Track expiry for all food handler cards / ServSafe certifications for front-of-house and kitchen staff.",
      deadline_type: "employee_cert",
      governing_agency: "State Health Department",
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
    });
    push({
      name: "State Sales Tax Filing — Monthly",
      description: "Monthly state sales tax return for food/beverage sales. Verify filing frequency with your state revenue department.",
      deadline_type: "tax_filing",
      governing_agency: `${data.state} Department of Revenue`,
      frequency: "monthly",
      due_date: formatIsoDate(nextDate(today.getMonth() + 1 > 11 ? 0 : today.getMonth() + 1, 20)),
    });
  }

  // ── Industry: Construction ────────────────────────────────────────────────
  if (data.industry === "construction") {
    push({
      name: "Contractor License Renewal",
      description: "State contractor license renewal. Required to legally bid and perform work.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Contractors Licensing Board`,
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
    });
    if (data.hiresContractors) {
      push({
        name: "Subcontractor COI Renewals",
        description: "Certificate of Insurance renewals for all active subcontractors. Expired COIs expose you to liability.",
        deadline_type: "coi",
        governing_agency: "Insurance Provider",
        frequency: "annual",
        due_date: formatIsoDate(nextYear),
      });
    }
  }

  // ── Industry: Healthcare ──────────────────────────────────────────────────
  if (data.industry === "healthcare") {
    push({
      name: "Professional License Renewals",
      description: "Track all staff professional license renewals (RN, MD, PT, etc.) and continuing education requirements.",
      deadline_type: "employee_cert",
      governing_agency: `${data.state} Professional Licensing Board`,
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
    });
    push({
      name: "DEA Registration Renewal",
      description: "DEA practitioner registration renewal required for any provider authorized to prescribe controlled substances. Typically triennial.",
      deadline_type: "business_license",
      governing_agency: "DEA",
      frequency: "triennial",
      due_date: formatIsoDate(new Date(today.getFullYear() + 3, today.getMonth(), today.getDate())),
    });
    push({
      name: "HIPAA Security Risk Assessment",
      description: "Annual HIPAA Security Rule risk analysis required for all covered entities and business associates. Document findings and remediation plan.",
      deadline_type: "equipment_inspection",
      governing_agency: "HHS / OCR",
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
    });
  }

  // ── Industry: Retail ──────────────────────────────────────────────────────
  if (data.industry === "retail") {
    push({
      name: "State Sales Tax Filing",
      description: "Monthly or quarterly state sales tax return. Verify your filing frequency — high-volume retailers file monthly.",
      deadline_type: "tax_filing",
      governing_agency: `${data.state} Department of Revenue`,
      frequency: "monthly",
      due_date: formatIsoDate(nextDate(today.getMonth() + 1 > 11 ? 0 : today.getMonth() + 1, 20)),
    });
    push({
      name: "Seller's Permit / Retail License Renewal",
      description: "State retail seller's permit renewal. Required to collect and remit sales tax. Verify renewal period with your state.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Department of Revenue`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
    });
  }

  // ── Industry: Personal Services (salons, auto, cleaners) ──────────────────
  if (data.industry === "personal_services") {
    push({
      name: "Cosmetology / Trade License Renewal",
      description: "State professional board license renewal for barbers, cosmetologists, estheticians, and nail technicians. Required for all licensed staff.",
      deadline_type: "employee_cert",
      governing_agency: `${data.state} Board of Cosmetology`,
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
    });
    push({
      name: "Establishment License Renewal",
      description: "State facility license for salon, spa, or personal service establishment. Separate from individual staff licenses.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Board of Cosmetology / Health`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
    });
  }

  // ── Industry: Fitness / Wellness ──────────────────────────────────────────
  if (data.industry === "fitness") {
    push({
      name: "Fitness Facility License Renewal",
      description: "State fitness facility registration or health club license. Required in most states; protects members under consumer protection laws.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Department of Consumer Affairs`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
    });
    push({
      name: "Personal Trainer / Instructor Certifications",
      description: "Track expiry for staff CPT, group fitness, and CPR/AED certifications. Many states require proof of certification for insurance compliance.",
      deadline_type: "employee_cert",
      governing_agency: "NASM / ACE / NSCA",
      frequency: "biennial",
      due_date: formatIsoDate(nextYear),
    });
  }

  // ── Industry: Transportation / Logistics ──────────────────────────────────
  if (data.industry === "transportation") {
    push({
      name: "USDOT Number Biennial Update",
      description: "FMCSA requires carriers to update their USDOT number information every 2 years and within 30 days of operational changes.",
      deadline_type: "business_license",
      governing_agency: "FMCSA / USDOT",
      frequency: "biennial",
      due_date: formatIsoDate(new Date(today.getFullYear() + 2, today.getMonth(), today.getDate())),
    });
    push({
      name: "Commercial Vehicle Registration Renewal",
      description: "Annual registration renewal for all commercial vehicles. Verify deadlines per vehicle with your state DMV.",
      deadline_type: "business_license",
      governing_agency: `${data.state} DMV / DOT`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
    });
    if (hasEmployees) {
      push({
        name: "CDL / Driver License Renewals",
        description: "Track CDL renewal deadlines for all commercial drivers. CDLs expire every 4–8 years depending on state; medical certificates every 2 years.",
        deadline_type: "employee_cert",
        governing_agency: `${data.state} DMV`,
        frequency: "biennial",
        due_date: formatIsoDate(new Date(today.getFullYear() + 2, today.getMonth(), today.getDate())),
      });
    }
  }

  // ── Industry: Manufacturing ───────────────────────────────────────────────
  if (data.industry === "manufacturing") {
    push({
      name: "EPA Hazardous Waste Annual Report",
      description: "Large-quantity generators must submit an annual hazardous waste report to the EPA by March 1. Small-quantity generators may have reporting obligations.",
      deadline_type: "equipment_inspection",
      governing_agency: "EPA",
      frequency: "annual",
      due_date: formatIsoDate(nextDate(2, 1)), // March 1
    });
    push({
      name: "Air Permit / Emissions Reporting",
      description: "Annual air quality permit renewal and emissions inventory report. Timing varies by state and permit class. Verify with your state environmental agency.",
      deadline_type: "business_license",
      governing_agency: `${data.state} Environmental Agency`,
      frequency: "annual",
      due_date: formatIsoDate(nextYear),
    });
  }

  if (deadlines.length > 0) {
    await supabase.from("deadlines").insert(deadlines);
  }
}

