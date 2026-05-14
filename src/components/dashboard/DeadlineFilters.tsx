"use client";

import { useRouter, useSearchParams } from "next/navigation";

const STATUSES = [
  { value: "", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "in_progress", label: "Due Soon" },
  { value: "upcoming", label: "Upcoming" },
  { value: "compliant", label: "Compliant" },
];

const TYPES = [
  { value: "", label: "All Types" },
  { value: "business_license", label: "Business License" },
  { value: "employee_cert", label: "Employee Cert" },
  { value: "coi", label: "COI" },
  { value: "entity_filing", label: "Entity Filing" },
  { value: "equipment_inspection", label: "Inspection" },
  { value: "tax", label: "Tax" },
  { value: "other", label: "Other" },
];

export default function DeadlineFilters({
  currentStatus,
  currentType,
}: {
  currentStatus?: string;
  currentType?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/deadlines?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 mb-5">
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
        {STATUSES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => applyFilter("status", value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              (currentStatus ?? "") === value
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <select
        value={currentType ?? ""}
        onChange={(e) => applyFilter("type", e.target.value)}
        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {TYPES.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
