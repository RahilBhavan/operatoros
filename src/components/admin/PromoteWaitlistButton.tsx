"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PromoteWaitlistButton({
  id,
  email,
  invited,
}: {
  id: string;
  email: string;
  invited: boolean;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<"idle" | "confirm" | "busy">("idle");
  const [error, setError] = useState("");

  if (invited) {
    return (
      <span className="t-utility !text-[12px] !text-[var(--color-ground)] opacity-50">
        INVITED
      </span>
    );
  }

  async function handlePromote() {
    setStage("busy");
    setError("");
    const res = await fetch(`/api/admin/waitlist/${id}/invite`, { method: "POST" });
    if (!res.ok) {
      setStage("confirm");
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Failed");
      return;
    }
    setStage("idle");
    router.refresh();
  }

  if (stage === "idle") {
    return (
      <button
        onClick={() => setStage("confirm")}
        className="t-utility !text-[12px] hover:text-[var(--color-mark)]"
      >
        INVITE →
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <span className="t-caption !text-[12px] truncate max-w-[160px]">{email}?</span>
      <button
        onClick={handlePromote}
        disabled={stage === "busy"}
        className="t-utility !text-[12px] !text-[var(--color-mark)] hover:opacity-70 disabled:opacity-50"
      >
        {stage === "busy" ? "SENDING…" : "SEND"}
      </button>
      <button
        onClick={() => {
          setStage("idle");
          setError("");
        }}
        disabled={stage === "busy"}
        className="t-utility !text-[12px] !text-[var(--color-ground)] opacity-60 hover:opacity-100 disabled:opacity-30"
      >
        CANCEL
      </button>
      {error && (
        <span className="t-utility !text-[12px] !text-[var(--color-mark)]">{error}</span>
      )}
    </span>
  );
}
