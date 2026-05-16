"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import { Button, Utility, Index } from "@/components/doctrine";

type DeadlineRow = Database["public"]["Tables"]["deadlines"]["Row"];

const DEADLINE_TYPES = [
  { value: "business_license", label: "Business License" },
  { value: "employee_cert", label: "Employee Certification" },
  { value: "coi", label: "Certificate of Insurance" },
  { value: "entity_filing", label: "Entity Filing" },
  { value: "equipment_inspection", label: "Equipment Inspection" },
  { value: "tax", label: "Tax Deadline" },
  { value: "other", label: "Other" },
];

const FREQUENCIES = [
  { value: "annual", label: "Annual" },
  { value: "biennial", label: "Every 2 years" },
  { value: "quarterly", label: "Quarterly" },
  { value: "one_time", label: "One-time" },
];

interface Props {
  businessId: string;
  existing?: DeadlineRow;
}

export default function DeadlineForm({ businessId, existing }: Props) {
  const router = useRouter();
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [deadlineType, setDeadlineType] = useState(
    existing?.deadline_type ?? "business_license"
  );
  const [governingAgency, setGoverningAgency] = useState(
    existing?.governing_agency ?? ""
  );
  const [frequency, setFrequency] = useState(existing?.frequency ?? "annual");
  const [dueDate, setDueDate] = useState(existing?.due_date ?? "");
  const [status, setStatus] = useState<DeadlineRow["status"]>(
    existing?.status ?? "upcoming"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !dueDate) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      if (isEdit && existing) {
        const { error: err } = await supabase
          .from("deadlines")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            deadline_type: deadlineType,
            governing_agency: governingAgency.trim() || null,
            frequency,
            due_date: dueDate,
            status,
          })
          .eq("id", existing.id);

        if (err) {
          setError("Failed to update deadline. Please try again.");
          return;
        }

        router.push(`/deadlines/${existing.id}`);
        router.refresh();
      } else {
        const { data, error: err } = await supabase
          .from("deadlines")
          .insert({
            business_id: businessId,
            name: name.trim(),
            description: description.trim() || null,
            deadline_type: deadlineType,
            governing_agency: governingAgency.trim() || null,
            frequency,
            due_date: dueDate,
            status: "upcoming",
            source: "user_manual",
          })
          .select("id")
          .single();

        if (err || !data) {
          setError("Failed to save deadline. Please try again.");
          return;
        }

        router.push(`/deadlines/${data.id}`);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-2 border-[var(--color-ground)] bg-[var(--color-field)]"
    >
      {/* FORM header strip */}
      <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between">
        <Utility className="!text-[var(--color-field)] !opacity-90">
          {isEdit ? "FORM · EDIT DEADLINE" : "FORM · NEW DEADLINE"}
        </Utility>
        <Index className="!text-[var(--color-field)] !text-[13px]">
          PA-DL-{isEdit ? "EDIT" : "NEW"}
        </Index>
      </div>

      <div className="px-5 py-6 flex flex-col gap-5">
        {/* SECTION 01 · ESSENTIALS */}
        <div className="flex items-baseline gap-3">
          <Index className="!text-[19px]">01</Index>
          <Utility>· ESSENTIALS</Utility>
        </div>

        <FormField label="DEADLINE NAME" required>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Illinois LLC Annual Report"
            className="t-input"
          />
        </FormField>

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="TYPE" required>
            <select
              value={deadlineType}
              onChange={(e) => setDeadlineType(e.target.value)}
              className="t-input"
            >
              {DEADLINE_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="FREQUENCY" required>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="t-input"
            >
              {FREQUENCIES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* SECTION 02 · SCHEDULE */}
        <div className="flex items-baseline gap-3 border-t-2 border-[var(--color-ground)] pt-6 mt-2">
          <Index className="!text-[19px]">02</Index>
          <Utility>· SCHEDULE</Utility>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="DUE DATE" required>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="t-input"
            />
          </FormField>

          {isEdit && (
            <FormField label="STATUS">
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as DeadlineRow["status"])
                }
                className="t-input"
              >
                <option value="upcoming">Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="compliant">Compliant</option>
                <option value="overdue">Overdue</option>
              </select>
            </FormField>
          )}
        </div>

        {/* SECTION 03 · CONTEXT */}
        <div className="flex items-baseline gap-3 border-t-2 border-[var(--color-ground)] pt-6 mt-2">
          <Index className="!text-[19px]">03</Index>
          <Utility>· CONTEXT</Utility>
        </div>

        <FormField label="GOVERNING AGENCY">
          <input
            type="text"
            value={governingAgency}
            onChange={(e) => setGoverningAgency(e.target.value)}
            placeholder="e.g. Illinois Secretary of State"
            className="t-input"
          />
        </FormField>

        <FormField label="DESCRIPTION">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes, renewal process, or requirements…"
            rows={3}
            className="t-input"
          />
        </FormField>

        {error && (
          <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-4 py-2">
            <Utility className="!text-[var(--color-field)]">ERROR</Utility>
            <span className="t-body !text-[var(--color-field)] block">
              {error}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t-2 border-[var(--color-ground)] mt-2">
          <Button
            type="submit"
            variant="ground"
            disabled={loading || !name.trim() || !dueDate}
          >
            {loading
              ? isEdit
                ? "Saving…"
                : "Adding…"
              : isEdit
              ? "Save Changes →"
              : "Add Deadline →"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block mb-2">
        <Utility>
          {label}
          {required && (
            <span className="text-[var(--color-mark)] ml-1">*</span>
          )}
        </Utility>
      </label>
      {children}
    </div>
  );
}
