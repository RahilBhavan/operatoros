import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";

type Deadline = Database["public"]["Tables"]["deadlines"]["Row"];

export type AccountantPortfolioLink = {
  token: string;
  business_id: string;
  business_name: string;
};

export type AccountantPortalPayload = {
  connection: {
    id: string;
    business_id: string;
    accountant_email: string;
    accountant_name: string | null;
    created_at: string;
  };
  business: {
    id: string;
    name: string;
    industry_sic_code: string | null;
    entity_type: string | null;
    employee_count: number | null;
  };
  deadlines: Deadline[];
  portfolio: AccountantPortfolioLink[];
  /** Notes keyed by deadline id for this magic-link token */
  noteByDeadlineId: Record<string, string>;
};

/**
 * Server-only: all queries are scoped by the accountant magic-link token from the URL.
 */
export async function loadAccountantPortalByToken(
  rawToken: string
): Promise<AccountantPortalPayload | null> {
  const supabase = createAdminClient();

  const { data: connection } = await supabase
    .from("accountant_connections")
    .select("id, business_id, accountant_email, accountant_name, created_at")
    .eq("token", rawToken)
    .maybeSingle();

  if (!connection) return null;

  const [
    ,
    { data: business },
    { data: deadlines },
    { data: otherRows },
    { data: noteRows },
  ] = await Promise.all([
    supabase
      .from("accountant_connections")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("id", connection.id),
    supabase
      .from("businesses")
      .select("id, name, industry_sic_code, entity_type, employee_count")
      .eq("id", connection.business_id)
      .maybeSingle(),
    supabase
      .from("deadlines")
      .select("*")
      .eq("business_id", connection.business_id)
      .order("due_date", { ascending: true }),
    supabase
      .from("accountant_connections")
      .select("token, business_id, businesses!inner(name)")
      .eq("accountant_email", connection.accountant_email)
      .neq("id", connection.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("accountant_deadline_notes")
      .select("deadline_id, note")
      .eq("accountant_token", rawToken),
  ]);

  if (!business) return null;

  type OtherRow = {
    token: string;
    business_id: string;
    businesses: { name: string } | { name: string }[];
  };

  const portfolio: AccountantPortfolioLink[] = (otherRows ?? []).map(
    (row: OtherRow) => {
      const nm = Array.isArray(row.businesses)
        ? row.businesses[0]?.name
        : row.businesses?.name;
      return {
        token: row.token,
        business_id: row.business_id,
        business_name: nm ?? "Unknown",
      };
    }
  );

  const noteByDeadlineId: Record<string, string> = {};
  for (const row of noteRows ?? []) {
    if (row.deadline_id && row.note) noteByDeadlineId[row.deadline_id] = row.note;
  }

  return {
    connection,
    business,
    deadlines: deadlines ?? [],
    portfolio,
    noteByDeadlineId,
  };
}
