import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getSupabaseAdminConfig } from "@/lib/supabase/config";

export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminConfig();
  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
