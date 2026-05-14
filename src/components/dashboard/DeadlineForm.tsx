"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

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
        setLoading(false);
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
        setLoading(false);
        return;
      }

      router.push(`/deadlines/${data.id}`);
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-5"
    >
      <Field label="Deadline name" required>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Illinois LLC Annual Report"
          className={INPUT_CLASS}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Type" required>
          <select
            value={deadlineType}
            onChange={(e) => setDeadlineType(e.target.value)}
            className={INPUT_CLASS}
          >
            {DEADLINE_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Frequency" required>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className={INPUT_CLASS}
          >
            {FREQUENCIES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Due date" required>
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>

        {isEdit && (
          <Field label="Status">
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as DeadlineRow["status"])
              }
              className={INPUT_CLASS}
            >
              <option value="upcoming">Upcoming</option>
              <option value="in_progress">In Progress</option>
              <option value="compliant">Compliant</option>
              <option value="overdue">Overdue</option>
            </select>
          </Field>
        )}
      </div>

      <Field label="Governing agency">
        <input
          type="text"
          value={governingAgency}
          onChange={(e) => setGoverningAgency(e.target.value)}
          placeholder="e.g. Illinois Secretary of State"
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes, renewal process, or requirements…"
          rows={3}
          className={INPUT_CLASS}
        />
      </Field>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !name.trim() || !dueDate}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {loading
            ? isEdit
              ? "Saving…"
              : "Adding…"
            : isEdit
            ? "Save Changes"
            : "Add Deadline"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-slate-600 hover:text-slate-900 font-medium text-sm px-4 py-2.5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
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
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLASS =
  "w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 bg-white";
