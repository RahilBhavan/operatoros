"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Utility, Index } from "@/components/doctrine";

export default function MarkCompliantButton({
  deadlineId,
}: {
  deadlineId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [marked, setMarked] = useState(false);
  const [markedAt, setMarkedAt] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleMark() {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: updateErr } = await supabase
        .from("deadlines")
        .update({ status: "compliant" })
        .eq("id", deadlineId);
      if (updateErr) throw updateErr;
      setMarkedAt(new Date().toISOString());
      setMarked(true);
      router.refresh();
    } catch {
      setError("Failed to update. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (marked && markedAt) {
    const ts = new Date(markedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return (
      <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field-soft)] px-4 py-3 inline-flex flex-col items-start gap-1">
        <Utility>MARKED COMPLIANT</Utility>
        <Index className="!text-[19px]">{ts}</Index>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <Button
        variant="mark"
        onClick={handleMark}
        disabled={loading}
      >
        {loading ? "Marking…" : "✓ Mark Compliant"}
      </Button>
      {error && (
        <span className="t-caption !text-[var(--color-mark)]">{error}</span>
      )}
    </div>
  );
}
