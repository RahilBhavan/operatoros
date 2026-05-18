"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Utility, Body } from "@/components/doctrine";

export default function DeleteDeadlineButton({
  deadlineId,
}: {
  deadlineId: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: deleteErr } = await supabase
        .from("deadlines")
        .delete()
        .eq("id", deadlineId);
      if (deleteErr) throw deleteErr;
      router.push("/deadlines");
      router.refresh();
    } catch {
      setError("Failed to delete. Please try again.");
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] p-4 inline-flex flex-col items-start gap-3 max-w-md">
        <Utility className="!text-[var(--color-field)]">CONFIRM DELETE</Utility>
        <Body className="!text-[var(--color-field)]">
          Delete this deadline permanently? All attached documents will be
          removed.
        </Body>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="btn btn-mark border-[var(--color-field)] !bg-[var(--color-field)] !text-[var(--color-mark)] hover:!bg-[var(--color-ground)] hover:!text-[var(--color-field)] hover:border-[var(--color-ground)]"
          >
            {loading ? "Deleting…" : "✕ Confirm Delete"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="btn btn-ghost !text-[var(--color-field)] !border-[var(--color-field)] hover:!bg-[var(--color-field)] hover:!text-[var(--color-mark)]"
          >
            Cancel
          </button>
        </div>
        {error && (
          <span className="t-caption !text-[var(--color-field)] ">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <Button variant="ghost" onClick={() => setConfirming(true)}>
      <Trash2 className="w-4 h-4 inline-block mr-1.5 align-[-2px]" />
      Delete
    </Button>
  );
}
