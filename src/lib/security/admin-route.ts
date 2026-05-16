import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AdminAuthResult =
  | { ok: true; user: { id: string; email: string } }
  | { ok: false; response: NextResponse };

/**
 * Guard for admin API routes. Returns either { ok: true, user } or a ready-
 * to-return 404 response (we never reveal that /api/admin/* even exists to
 * non-admins). Uses the `is_platform_admin()` RPC so the check matches what
 * RLS policies would see.
 */
export async function requirePlatformAdminForRoute(): Promise<AdminAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  const { data: allowed } = await supabase.rpc("is_platform_admin");
  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }
  return { ok: true, user: { id: user.id, email: user.email ?? "" } };
}
