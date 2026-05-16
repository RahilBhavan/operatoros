import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PlatformAdminContext = {
  user: { id: string; email: string };
  admin: { display_name: string | null };
};

/**
 * Require an active platform admin. 404s anything else so we never reveal
 * the existence of /admin routes to non-admins. Unauthenticated users get
 * the sign-in flow first. Single source of truth for the gate — uses the
 * `is_platform_admin()` SECURITY DEFINER RPC so the check matches what RLS
 * policies would see.
 */
export async function requirePlatformAdmin(): Promise<PlatformAdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in?next=/admin");

  const { data: allowed } = await supabase.rpc("is_platform_admin");
  if (!allowed) notFound();

  // Hydrate display name for the nav. Selecting from platform_admins is
  // RLS-safe because we just confirmed admin status.
  const { data: admin } = await supabase
    .from("platform_admins")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    user: { id: user.id, email: user.email ?? "" },
    admin: { display_name: admin?.display_name ?? null },
  };
}

export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.rpc("is_platform_admin");
  return !!data;
}
