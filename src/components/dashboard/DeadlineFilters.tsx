"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Utility } from "@/components/doctrine";

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
    <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1">
        <Utility className="!text-[12px]">STATUS</Utility>
        <div className="flex flex-wrap items-center -ml-px">
          {STATUSES.map(({ value, label }) => {
            const active = (currentStatus ?? "") === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => applyFilter("status", value)}
                className={`-ml-px border-2 border-[var(--color-ground)] px-3 py-2 t-utility !text-[12px] min-h-[44px] ${
                  active
                    ? "bg-[var(--color-ground)] text-[var(--color-field)] !opacity-100"
                    : "bg-[var(--color-field)] text-[var(--color-ground)] !opacity-100 hover:bg-[var(--color-field-soft)]"
                }`}
                aria-pressed={active}
              >
                {label.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Utility className="!text-[12px]">TYPE</Utility>
        <select
          value={currentType ?? ""}
          onChange={(e) => applyFilter("type", e.target.value)}
          className="t-input min-h-[44px]"
        >
          {TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
