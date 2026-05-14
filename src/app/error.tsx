"use client";

import { useEffect } from "react";
import { Shield } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4">
      <div className="flex items-center gap-2 mb-8">
        <Shield className="w-6 h-6 text-blue-600" />
        <span className="font-bold text-xl text-slate-900">OperatorOS</span>
      </div>
      <h2 className="text-xl font-semibold text-slate-700 mb-2">
        Something went wrong
      </h2>
      <p className="text-slate-500 mb-8 max-w-sm">
        An unexpected error occurred. Please try again or contact support if the
        issue persists.
      </p>
      <button
        onClick={reset}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
