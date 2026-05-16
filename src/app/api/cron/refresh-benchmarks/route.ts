import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.VERCEL === "1") {
    const ua = req.headers.get("user-agent") ?? "";
    if (!ua.includes("vercel-cron")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const rpc = supabase.rpc as unknown as (
    fn: "refresh_industry_benchmarks"
  ) => Promise<{ data: null; error: { message: string } | null }>;

  const { error } = await rpc("refresh_industry_benchmarks");
  if (error) {
    return NextResponse.json(
      { error: "refresh_failed", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, refreshed_at: new Date().toISOString() });
}
