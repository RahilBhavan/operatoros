"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Utility, Body } from "@/components/doctrine";

type Phase = "idle" | "confirm" | "busy" | "done" | "error";

export default function RevokeInviteButton({
  membershipId,
}: {
  membershipId: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");

  async function handleRevoke() {
    setPhase("busy");
    setError("");
    try {
      const res = await fetch(
        `/api/team/invite?id=${encodeURIComponent(membershipId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Failed to revoke invite.");
        setPhase("error");
        return;
      }
      setPhase("done");
      router.refresh();
    } catch {
      setError("Failed to revoke invite.");
      setPhase("error");
    }
  }

  if (phase === "confirm" || phase === "busy" || phase === "error") {
    return (
      <span className="inline-flex flex-col items-end gap-2 border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] p-3">
        <Utility className="!text-[var(--color-field)] !text-[11px]">
          Revoke invite?
        </Utility>
        <span className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={handleRevoke}
            disabled={phase === "busy"}
            className="t-utility !text-[11px] text-[var(--color-field)] underline underline-offset-2 hover:no-underline focus-visible:underline"
          >
            {phase === "busy" ? "Revoking…" : "Confirm"}
          </button>
          <span aria-hidden className="text-[var(--color-field)]">·</span>
          <button
            type="button"
            onClick={() => {
              setPhase("idle");
              setError("");
            }}
            disabled={phase === "busy"}
            className="t-utility !text-[11px] text-[var(--color-field)] hover:no-underline focus-visible:underline"
          >
            Cancel
          </button>
        </span>
        {phase === "error" && error ? (
          <Body className="!text-[12px] !text-[var(--color-field)]">{error}</Body>
        ) : null}
      </span>
    );
  }

  if (phase === "done") {
    return (
      <span className="t-utility !text-[12px] text-[var(--color-ground)]">
        REVOKED
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPhase("confirm")}
      className="t-utility !text-[12px] text-[var(--color-ground)] hover:text-[var(--color-mark)]"
    >
      REVOKE →
    </button>
  );
}
