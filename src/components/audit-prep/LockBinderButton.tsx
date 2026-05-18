"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/doctrine/Button";

export default function LockBinderButton({ binderId }: { binderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function lock() {
    if (
      !window.confirm(
        "Lock this binder? Once locked, the snapshot is immutable and the included deadlines are frozen as-is for the surveyor."
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/audit-binders/${binderId}/lock`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to lock.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={lock} disabled={busy} variant="mark">
        {busy ? "Locking…" : "Lock binder →"}
      </Button>
      {error ? (
        <span className="t-utility text-[var(--color-mark)]">{error}</span>
      ) : null}
    </div>
  );
}
