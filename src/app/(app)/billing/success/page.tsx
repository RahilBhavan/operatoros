import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function BillingSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        You&apos;re all set!
      </h1>
      <p className="text-slate-500 mb-8 max-w-sm">
        Your subscription is active. Your compliance deadlines are ready to
        track.
      </p>
      <Link
        href="/dashboard"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
