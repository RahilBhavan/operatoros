"use client";

import { useState } from "react";
import { Flag } from "lucide-react";

type Mode = "idle" | "open" | "busy" | "ok" | "error";

type FieldKey =
  | "name"
  | "description"
  | "governing_agency"
  | "frequency"
  | "severity_tier"
  | "source_url"
  | "statute_citation";

const FIELD_LABELS: Record<FieldKey, string> = {
  name: "Rule name",
  description: "Description",
  governing_agency: "Governing agency",
  frequency: "Frequency",
  severity_tier: "Severity tier",
  source_url: "Source URL",
  statute_citation: "Statute citation",
};

const FREQUENCIES = [
  "quarterly",
  "annual",
  "monthly",
  "one_time",
  "event_driven",
  "biennial",
  "semiannual",
] as const;

const SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;

// Accountants flag a rule with a free-text rationale + (optionally) a
// structured one-field override. The structured part is intentionally
// narrow: full diff editing belongs to admins. Goal here is to capture
// "the deadline is on the wrong date" or "this agency reorg moved it
// elsewhere", with enough structure that an admin can accept in one click.
export default function FlagRuleButton({
  token,
  ruleId,
  ruleName,
}: {
  token: string;
  ruleId: string | null;
  ruleName: string;
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [field, setField] = useState<FieldKey | "">("");
  const [fieldValue, setFieldValue] = useState("");
  const [rationale, setRationale] = useState("");
  const [citation, setCitation] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!ruleId) {
    // The deadline isn't linked to a regulatory_rules row yet — usually a
    // hand-created deadline. Render a muted button that hovers a tooltip
    // instead of a real flag flow.
    return (
      <span
        title="This deadline isn't linked to a regulatory rule yet — corrections are only available for rule-backed deadlines."
        className="inline-flex items-center gap-1 text-[var(--color-ground)] opacity-30 t-utility !text-[11px]"
      >
        <Flag className="w-3 h-3" />
        <span>FLAG</span>
      </span>
    );
  }

  async function submit() {
    if (rationale.trim().length < 8) {
      setError("Rationale must be at least 8 characters.");
      return;
    }
    const proposed_changes: Record<string, unknown> = {};
    if (field && fieldValue.trim().length > 0) {
      proposed_changes[field] = fieldValue.trim();
    } else {
      // No structured field — submit rationale-only. The API requires
      // at least one change; we surface a synthetic "rationale" change so
      // the admin can see "this is a notes-only flag." (Server validator
      // ignores unknown keys.)
      proposed_changes.description = `[FLAG: see rationale] ${rationale.trim().slice(0, 200)}`;
    }
    setMode("busy");
    setError(null);
    try {
      const res = await fetch("/api/accountant/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rule_id: ruleId,
          proposed_changes,
          rationale: rationale.trim(),
          citation_url: citation.trim() || null,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? `Submit failed (${res.status})`);
        setMode("error");
        return;
      }
      setMode("ok");
      setField("");
      setFieldValue("");
      setRationale("");
      setCitation("");
    } catch {
      setError("Network error");
      setMode("error");
    }
  }

  if (mode === "idle") {
    return (
      <button
        type="button"
        onClick={() => setMode("open")}
        className="inline-flex items-center gap-1 text-[var(--color-ground)] opacity-50 hover:opacity-100 hover:text-[var(--color-mark)] t-utility !text-[11px]"
        aria-label={`Flag rule: ${ruleName}`}
      >
        <Flag className="w-3 h-3" />
        <span>FLAG</span>
      </button>
    );
  }

  if (mode === "ok") {
    return (
      <span className="inline-flex items-center gap-1 text-[var(--color-ground)] t-utility !text-[11px]">
        <Flag className="w-3 h-3" />
        <span>SUBMITTED ✓</span>
      </span>
    );
  }

  return (
    <div className="mt-3 border-2 border-[var(--color-ground)] bg-[var(--color-field)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="t-utility !text-[12px]">FLAG: {ruleName.toUpperCase()}</span>
        <button
          type="button"
          onClick={() => {
            setMode("idle");
            setError(null);
          }}
          className="t-utility !text-[11px] opacity-60 hover:opacity-100"
        >
          ✕ CLOSE
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="t-utility opacity-60 !text-[11px]">WHAT FIELD IS WRONG (OPTIONAL)</span>
        <select
          value={field}
          onChange={(e) => {
            setField(e.target.value as FieldKey | "");
            setFieldValue("");
          }}
          disabled={mode === "busy"}
          className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-3 py-1.5 t-body !text-[13px]"
        >
          <option value="">— rationale only —</option>
          {(Object.keys(FIELD_LABELS) as FieldKey[]).map((k) => (
            <option key={k} value={k}>
              {FIELD_LABELS[k]}
            </option>
          ))}
        </select>
      </label>

      {field && (
        <label className="flex flex-col gap-1">
          <span className="t-utility opacity-60 !text-[11px]">
            CORRECT VALUE FOR {FIELD_LABELS[field].toUpperCase()}
          </span>
          {field === "severity_tier" ? (
            <select
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              disabled={mode === "busy"}
              className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-3 py-1.5 t-body !text-[13px]"
            >
              <option value="">— select —</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : field === "frequency" ? (
            <select
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              disabled={mode === "busy"}
              className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-3 py-1.5 t-body !text-[13px]"
            >
              <option value="">— select —</option>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              disabled={mode === "busy"}
              maxLength={2000}
              className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-3 py-1.5 t-body !text-[13px]"
            />
          )}
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="t-utility opacity-60 !text-[11px]">
          RATIONALE (REQUIRED, ≥ 8 CHARS)
        </span>
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={3}
          maxLength={4000}
          disabled={mode === "busy"}
          placeholder="Why is this wrong? Cite the agency notice or statute if you can."
          className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-3 py-2 t-body !text-[13px]"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="t-utility opacity-60 !text-[11px]">CITATION URL (OPTIONAL)</span>
        <input
          value={citation}
          onChange={(e) => setCitation(e.target.value)}
          disabled={mode === "busy"}
          maxLength={2000}
          placeholder="https://www.irs.gov/…"
          className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-3 py-1.5 t-body !text-[13px]"
        />
      </label>

      {error && (
        <p className="t-body !text-[var(--color-mark)] !text-[12px]">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={mode === "busy"}
          className="border-2 border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)] px-4 py-2 t-utility !text-[12px] disabled:opacity-50"
        >
          {mode === "busy" ? "SUBMITTING…" : "SUBMIT CORRECTION →"}
        </button>
        <span className="t-utility opacity-60 !text-[11px]">
          GOES TO ADMIN REVIEW QUEUE
        </span>
      </div>
    </div>
  );
}
