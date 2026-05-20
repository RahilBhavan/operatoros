"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormField } from "@/components/doctrine/FormField";

const STATUSES = [
  { value: "", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "in_progress", label: "Due ≤ 30 days" },
  { value: "upcoming", label: "Upcoming" },
  { value: "compliant", label: "Compliant" },
] as const;

const TYPES = [
  { value: "", label: "All types" },
  { value: "business_license", label: "Business license" },
  { value: "employee_cert", label: "Employee cert" },
  { value: "coi", label: "COI" },
  { value: "entity_filing", label: "Entity filing" },
  { value: "equipment_inspection", label: "Inspection" },
  { value: "tax", label: "Tax" },
  { value: "other", label: "Other" },
] as const;

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

  const activeFilters =
    (currentStatus ? 1 : 0) + (currentType ? 1 : 0);

  return (
    <div className="flex flex-col gap-4 border-2 border-[var(--color-ground)] bg-[var(--color-field)] p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="t-utility text-[var(--color-ground)]">Filter deadlines</span>
        {activeFilters > 0 ? (
          <button
            type="button"
            onClick={() => router.push("/deadlines")}
            className="t-utility text-[var(--color-mark)] hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <FormField label="Status">
        <div
          role="group"
          aria-label="Filter by status"
          className="flex flex-wrap gap-2"
        >
          {STATUSES.map(({ value, label }) => {
            const active = (currentStatus ?? "") === value;
            return (
              <button
                key={value || "all"}
                type="button"
                onClick={() => applyFilter("status", value)}
                aria-pressed={active}
                className={`px-3 py-2 min-h-[44px] t-utility border-2 border-[var(--color-ground)] transition-colors ${
                  active
                    ? "bg-[var(--color-ground)] text-[var(--color-field)]"
                    : "bg-[var(--color-field)] text-[var(--color-ground)] hover:bg-[var(--color-ground)] hover:text-[var(--color-field)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </FormField>

      <FormField label="Type" className="max-w-sm">
        <select
          value={currentType ?? ""}
          onChange={(e) => applyFilter("type", e.target.value)}
          className="t-input w-full"
          aria-label="Filter by deadline type"
        >
          {TYPES.map(({ value, label }) => (
            <option key={value || "all"} value={value}>
              {label}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}
