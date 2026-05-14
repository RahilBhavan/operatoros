import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";

type DeadlineRow = Pick<
  Database["public"]["Tables"]["deadlines"]["Row"],
  "id" | "name" | "deadline_type" | "due_date" | "status" | "governing_agency"
>;

export type ShareViewPayload = {
  expires_at: string;
  business: { id: string; name: string };
  deadlines: DeadlineRow[];
};

/**
 * Server-only: load share page data using service role after validating the raw token.
 * No anon Supabase policies on tenant tables — token is the capability.
 */
export async function loadShareViewByToken(
  rawToken: string
): Promise<ShareViewPayload | null> {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: shareToken } = await supabase
    .from("share_tokens")
    .select("business_id, expires_at")
    .eq("token", rawToken)
    .gt("expires_at", nowIso)
    .maybeSingle();

  if (!shareToken) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("id", shareToken.business_id)
    .maybeSingle();

  if (!business) return null;

  const { data: deadlines } = await supabase
    .from("deadlines")
    .select("id, name, deadline_type, due_date, status, governing_agency")
    .eq("business_id", business.id)
    .order("due_date", { ascending: true });

  return {
    expires_at: shareToken.expires_at,
    business,
    deadlines: deadlines ?? [],
  };
}
