const SUPABASE_ENV_HELP =
  "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Project → Settings → Environment Variables (Production and Preview), then redeploy. Values: https://supabase.com/dashboard/project/_/settings/api";

export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

export type SupabaseAdminConfig = SupabasePublicConfig & {
  serviceRoleKey: string;
};

/** Public Supabase URL + anon key (browser and server user sessions). */
export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      `Supabase is not configured. ${SUPABASE_ENV_HELP}`,
    );
  }

  return { url, anonKey };
}

/** Service-role client (server-only). */
export function getSupabaseAdminConfig(): SupabaseAdminConfig {
  const { url, anonKey } = getSupabasePublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey) {
    throw new Error(
      `Supabase service role key is not configured. Set SUPABASE_SERVICE_ROLE_KEY in Vercel env, then redeploy. ${SUPABASE_ENV_HELP}`,
    );
  }

  return { url, anonKey, serviceRoleKey };
}

export function isSupabasePublicConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}
