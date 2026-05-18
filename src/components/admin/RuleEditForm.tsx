"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Body, Caption, Utility } from "@/components/doctrine";

const SEVERITY_OPTIONS = ["critical", "high", "medium", "low", "info"] as const;

export type RuleEditFormProps = {
  ruleId: string;
  initial: {
    name: string;
    description: string;
    governing_agency: string;
    frequency: string;
    deadline_type: string;
    severity_tier: (typeof SEVERITY_OPTIONS)[number];
    penalty_estimate_cents: number | null;
    source_url: string | null;
    statute_citation: string | null;
    effective_date: string;
    sunset_date: string | null;
    due_date_rule: unknown;
    applies_when: unknown;
  };
};

type State = "idle" | "busy" | "error";

export default function RuleEditForm({ ruleId, initial }: RuleEditFormProps) {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [agency, setAgency] = useState(initial.governing_agency);
  const [frequency, setFrequency] = useState(initial.frequency);
  const [deadlineType, setDeadlineType] = useState(initial.deadline_type);
  const [severity, setSeverity] = useState<(typeof SEVERITY_OPTIONS)[number]>(
    initial.severity_tier
  );
  const [penaltyCents, setPenaltyCents] = useState<string>(
    initial.penalty_estimate_cents != null ? String(initial.penalty_estimate_cents) : ""
  );
  const [sourceUrl, setSourceUrl] = useState(initial.source_url ?? "");
  const [statute, setStatute] = useState(initial.statute_citation ?? "");
  const [effectiveDate, setEffectiveDate] = useState(initial.effective_date.slice(0, 10));
  const [sunsetDate, setSunsetDate] = useState(initial.sunset_date?.slice(0, 10) ?? "");

  const [dueDateRule, setDueDateRule] = useState(
    JSON.stringify(initial.due_date_rule, null, 2)
  );
  const [appliesWhen, setAppliesWhen] = useState(
    JSON.stringify(initial.applies_when, null, 2)
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setError("");

    let parsedDueDate: unknown;
    let parsedApplies: unknown;
    try {
      parsedDueDate = JSON.parse(dueDateRule);
    } catch {
      setState("error");
      setError("due_date_rule is not valid JSON.");
      return;
    }
    try {
      parsedApplies = JSON.parse(appliesWhen);
    } catch {
      setState("error");
      setError("applies_when is not valid JSON.");
      return;
    }

    const changes: Record<string, unknown> = {
      name,
      description,
      governing_agency: agency,
      frequency,
      deadline_type: deadlineType,
      severity_tier: severity,
      penalty_estimate_cents: penaltyCents,
      source_url: sourceUrl,
      statute_citation: statute,
      effective_date: effectiveDate,
      sunset_date: sunsetDate,
      due_date_rule: parsedDueDate,
      applies_when: parsedApplies,
    };

    const res = await fetch(`/api/admin/rules/${ruleId}/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changes }),
    });
    if (!res.ok) {
      let msg = "Save failed";
      try {
        const j = (await res.json()) as { error?: string };
        if (j.error) msg = j.error;
      } catch {
        /* ignore */
      }
      setState("error");
      setError(msg);
      return;
    }
    const body = (await res.json()) as { new_rule_id?: string };
    if (body.new_rule_id) {
      router.push(`/admin/rules/${body.new_rule_id}?versioned=1`);
      router.refresh();
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Row label="NAME">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="t-input"
          required
        />
      </Row>
      <Row label="DESCRIPTION">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="t-input min-h-[100px]"
          required
        />
      </Row>
      <div className="grid md:grid-cols-2 gap-4">
        <Row label="GOVERNING AGENCY">
          <input
            type="text"
            value={agency}
            onChange={(e) => setAgency(e.target.value)}
            className="t-input"
            required
          />
        </Row>
        <Row label="FREQUENCY">
          <input
            type="text"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="t-input"
            required
          />
        </Row>
        <Row label="DEADLINE TYPE">
          <input
            type="text"
            value={deadlineType}
            onChange={(e) => setDeadlineType(e.target.value)}
            className="t-input"
            required
          />
        </Row>
        <Row label="SEVERITY">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as (typeof SEVERITY_OPTIONS)[number])}
            className="t-input"
          >
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Row>
        <Row label="PENALTY (CENTS)">
          <input
            type="number"
            min={0}
            step={1}
            value={penaltyCents}
            onChange={(e) => setPenaltyCents(e.target.value)}
            className="t-input"
            placeholder="leave blank for none"
          />
        </Row>
        <Row label="EFFECTIVE DATE">
          <input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="t-input"
            required
          />
        </Row>
        <Row label="SUNSET DATE">
          <input
            type="date"
            value={sunsetDate}
            onChange={(e) => setSunsetDate(e.target.value)}
            className="t-input"
            placeholder="leave blank for none"
          />
        </Row>
        <Row label="STATUTE CITATION">
          <input
            type="text"
            value={statute}
            onChange={(e) => setStatute(e.target.value)}
            className="t-input"
            placeholder="optional"
          />
        </Row>
      </div>
      <Row label="SOURCE URL">
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          className="t-input"
          placeholder="optional"
        />
      </Row>
      <Row label="DUE_DATE_RULE (JSON)">
        <textarea
          value={dueDateRule}
          onChange={(e) => setDueDateRule(e.target.value)}
          className="t-input font-mono text-xs min-h-[120px]"
          spellCheck={false}
        />
        <Caption className="!text-[11px] mt-1 ">
          Shape: <code>{`{"kind": "next_md" | "next_year_md" | "months_from_today" | "years_from_today" | "years_from_today_first_of_month" | "next_month_day" | "quarterly_941", ...}`}</code>
        </Caption>
      </Row>
      <Row label="APPLIES_WHEN (JSON)">
        <textarea
          value={appliesWhen}
          onChange={(e) => setAppliesWhen(e.target.value)}
          className="t-input font-mono text-xs min-h-[120px]"
          spellCheck={false}
        />
        <Caption className="!text-[11px] mt-1 ">
          Filter shape: <code>{`{ state?, state_in?, state_not_in?, entity_in?, industry?, hires_contractors?, has_employees?, osha_required? }`}</code>
        </Caption>
      </Row>

      {error && (
        <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-4 py-3">
          <Utility className="mb-1 !text-[var(--color-field)]">ERROR</Utility>
          <Body className="!text-[var(--color-field)] !text-[14px]">{error}</Body>
        </div>
      )}

      <div className="flex items-center gap-4 pt-2 border-t border-[var(--color-ground)]">
        <button
          type="submit"
          disabled={state === "busy"}
          className="border-2 border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-2.5 t-utility"
        >
          {state === "busy" ? "Saving new version…" : "Save as new version"}
        </button>
        <Caption className="!text-[12px]">
          Creates v{"{n+1}"} and supersedes the current row. Logs to <code>audit_events</code>.
        </Caption>
      </div>
    </form>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Utility className=" mb-1.5 block">{label}</Utility>
      {children}
    </label>
  );
}
