"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function MarkCompliantButton({
  deadlineId,
}: {
  deadlineId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
      router.refresh();
    } catch {
      setError("Failed to update. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleMark}
        disabled={loading}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
      >
        <CheckCircle className="w-4 h-4" />
        {loading ? "Marking…" : "Mark as Compliant"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
