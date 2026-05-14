import Link from "next/link";
import { Shield } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4">
      <div className="flex items-center gap-2 mb-8">
        <Shield className="w-6 h-6 text-blue-600" />
        <span className="font-bold text-xl text-slate-900">OperatorOS</span>
      </div>
      <h1 className="text-6xl font-extrabold text-slate-300 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-slate-700 mb-2">
        Page not found
      </h2>
      <p className="text-slate-500 mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
