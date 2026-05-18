"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Mode = "idle" | "confirm_accept" | "reject_form" | "busy" | "done" | "error";

export default function CorrectionReviewActions({
  correctionId,
}: {
  correctionId: string;
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function accept() {
    setMode("busy");
    setError(null);
    try {
      const res = await fetch(`/api/admin/corrections/${correctionId}/accept`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? `Accept failed (${res.status})`);
        setMode("error");
        return;
      }
      setMode("done");
      startTransition(() => router.refresh());
    } catch {
      setError("Network error");
      setMode("error");
    }
  }

  async function reject() {
    const note = rejectNote.trim();
    if (note.length === 0) {
      setError("Reviewer note is required when rejecting.");
      return;
    }
    setMode("busy");
    setError(null);
    try {
      const res = await fetch(`/api/admin/corrections/${correctionId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_note: note }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? `Reject failed (${res.status})`);
        setMode("error");
        return;
      }
      setMode("done");
      startTransition(() => router.refresh());
    } catch {
      setError("Network error");
      setMode("error");
    }
  }

  if (mode === "done") {
    return (
      <p className="t-body !text-[14px]">
        Done. Refreshing…
      </p>
    );
  }

  if (mode === "confirm_accept") {
    return (
      <div className="flex flex-col gap-3">
        <p className="t-body !text-[14px]">
          Accept will fork a new version of this rule with the proposed changes,
          mark the correction accepted, and refresh confidence.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={accept}
            className="border-2 border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)] px-4 py-2 t-utility"
          >
            CONFIRM ACCEPT →
          </button>
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-4 py-2 t-utility"
          >
            CANCEL
          </button>
        </div>
      </div>
    );
  }

  if (mode === "reject_form") {
    return (
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="t-utility ">REVIEWER NOTE</span>
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Why is this correction being rejected? Surfaced to the proposing accountant."
            className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-3 py-2 t-body"
          />
        </label>
        {error && (
          <p className="t-body !text-[var(--color-mark)] !text-[13px]">{error}</p>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={reject}
            className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-4 py-2 t-utility"
          >
            CONFIRM REJECT →
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("idle");
              setError(null);
            }}
            className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-4 py-2 t-utility"
          >
            CANCEL
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setMode("confirm_accept")}
          disabled={mode === "busy"}
          className="border-2 border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)] px-4 py-2 t-utility"
        >
          ACCEPT
        </button>
        <button
          type="button"
          onClick={() => setMode("reject_form")}
          disabled={mode === "busy"}
          className="border-2 border-[var(--color-mark)] text-[var(--color-mark)] bg-[var(--color-field)] px-4 py-2 t-utility"
        >
          REJECT
        </button>
      </div>
      {error && <p className="t-body !text-[var(--color-mark)] !text-[13px]">{error}</p>}
    </div>
  );
}
