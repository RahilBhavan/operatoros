"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type State = "idle" | "busy" | "ok" | "error";

export default function VerifyRuleButton({ ruleId }: { ruleId: string }) {
  const [state, setState] = useState<State>("idle");
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function verify() {
    setState("busy");
    try {
      const res = await fetch(`/api/admin/rules/${ruleId}/verify`, {
        method: "POST",
      });
      if (!res.ok) {
        setState("error");
        return;
      }
      setState("ok");
      // Refresh the server component so the "last verified" timestamp updates.
      startTransition(() => router.refresh());
    } catch {
      setState("error");
    }
  }

  const label =
    state === "busy"
      ? "Verifying…"
      : state === "ok"
        ? "Verified ✓"
        : state === "error"
          ? "Retry"
          : "Mark verified";

  return (
    <button
      type="button"
      onClick={verify}
      disabled={state === "busy"}
      className="border-2 border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)] px-4 py-2 t-utility disabled:opacity-50"
    >
      {label}
    </button>
  );
}
