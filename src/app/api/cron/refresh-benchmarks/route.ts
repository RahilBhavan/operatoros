import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

function safeBearerCompare(authHeader: string | null, secret: string): boolean {
  const expected = `Bearer ${secret}`;
  const provided = authHeader ?? "";
  // Early-out on length mismatch — timingSafeEqual throws on unequal lengths
  // and the length difference itself isn't sensitive.
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (!safeBearerCompare(authHeader, cronSecret)) {
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

  // Weekly backstop refresh of rule_confidence in addition to the daily one
  // in /api/cron/reminders and the event-driven one in admin corrections.
  await (supabase.rpc as unknown as (fn: string) => Promise<unknown>)("refresh_rule_confidence");

  return NextResponse.json({ ok: true, refreshed_at: new Date().toISOString() });
}
