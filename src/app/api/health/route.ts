import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Lightweight probe to confirm this deployment is the compliance app (not a stale project). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "operatoros-compliance",
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  });
}
