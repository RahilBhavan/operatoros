"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Delete this deadline?</span>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-sm font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-300 transition-colors"
          >
            {loading ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium"
    >
      <Trash2 className="w-4 h-4" />
      Delete
    </button>
  );
}
