/**
 * WS-D — Public attribution redirect. Visitor lands on /i/<code>, we look
 * up the link, set the invite cookie if active, and bounce to /sign-up
 * with UTM params so the existing waitlist UTM capture works for invited
 * paths too. Revoked codes return 410 Gone.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  INVITE_CODE_COOKIE,
  INVITE_CODE_TTL_SECONDS,
  loadActiveInviteLink,
} from "@/lib/viral-attribution";
import { track } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const admin = createAdminClient();
  const link = await loadActiveInviteLink(admin, code);

  if (!link) {
    // Distinguish 410 (existed-then-revoked) from 404 (never existed) by
    // probing for a revoked row. Both are rare enough that one extra SELECT
    // on the miss path is fine.
    const { data: revoked } = await admin
      .from("accountant_invite_links")
      .select("id")
      .eq("code", code)
      .not("revoked_at", "is", null)
      .maybeSingle();
    if (revoked) {
      return new NextResponse("This invite link has been revoked.", {
        status: 410,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new NextResponse("Invite link not found.", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const base = req.nextUrl.origin;
  const target = new URL("/sign-up", base);
  target.searchParams.set("utm_source", "accountant");
  target.searchParams.set("utm_medium", "invite_link");
  target.searchParams.set("utm_campaign", link.code);

  const response = NextResponse.redirect(target, { status: 302 });
  response.cookies.set(INVITE_CODE_COOKIE, link.code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: INVITE_CODE_TTL_SECONDS,
    path: "/",
  });

  // WS-E — top-of-funnel: visitor hit a tracked invite link. The PostHog
  // distinct_id here is the link code (no auth yet); identify will merge
  // this anonymous session with the user id on signup_completed.
  void track({
    distinctId: `invite:${link.code}`,
    event: "invite_link_visited",
    properties: {
      accountant_id: link.accountant_id,
      invite_code: link.code,
    },
  });

  return response;
}
