import { isSupabasePublicConfigured } from "@/lib/supabase/config";

/** Shown on the marketing site when Vercel is missing Supabase public env vars. */
export function SupabaseSetupBanner() {
  if (isSupabasePublicConfigured()) return null;

  return (
    <div
      role="status"
      className="w-full bg-[var(--color-mark)] text-[var(--color-field)] border-b-4 border-[var(--color-ground)] px-6 py-3 text-center text-sm font-medium"
    >
      Deployment setup: add{" "}
      <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
      <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel
      → Environment Variables, then redeploy. Check{" "}
      <a href="/api/health" className="underline">
        /api/health
      </a>
      .
    </div>
  );
}
