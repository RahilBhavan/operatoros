import { NextResponse } from "next/server";
import { isSupabasePublicConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

/** Lightweight probe to confirm this deployment is the compliance app (not a stale project). */
export async function GET() {
  const supabaseConfigured = isSupabasePublicConfigured();
  const serviceRoleConfigured = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );

  return NextResponse.json({
    ok: supabaseConfigured,
    app: "operatoros-compliance",
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    supabase: {
      public: supabaseConfigured,
      serviceRole: serviceRoleConfigured,
    },
  });
}
