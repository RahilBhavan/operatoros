"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormField } from "@/components/doctrine/FormField";

const STATUSES = [
  { value: "", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "in_progress", label: "Due ≤ 30d" },
  { value: "upcoming", label: "Upcoming" },
  { value: "compliant", label: "Compliant" },
];

const TYPES = [
  { value: "", label: "All types" },
  { value: "business_license", label: "Business license" },
  { value: "employee_cert", label: "Employee cert" },
  { value: "coi", label: "COI" },
  { value: "entity_filing", label: "Entity filing" },
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
    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
      <FormField label="Status" className="flex-1 min-w-0">
        <div className="flex border-2 border-[var(--color-ground)] overflow-hidden">
          {STATUSES.map(({ value, label }, i) => {
            const active = (currentStatus ?? "") === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => applyFilter("status", value)}
                className={`flex-1 px-3 py-2 t-utility min-h-[44px] flex items-center justify-center ${
                  i < STATUSES.length - 1
                    ? "border-r-2 border-[var(--color-ground)]"
                    : ""
                } ${
                  active
                    ? "bg-[var(--color-ground)] text-[var(--color-field)]"
                    : "bg-[var(--color-field)] text-[var(--color-ground)] hover:bg-[var(--color-ground)] hover:text-[var(--color-field)]"
                }`}
                aria-pressed={active}
              >
                {label}
              </button>
            );
          })}
        </div>
      </FormField>

      <FormField label="Type" className="sm:w-[220px]">
        <select
          value={currentType ?? ""}
          onChange={(e) => applyFilter("type", e.target.value)}
          className="t-input"
        >
          {TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}
