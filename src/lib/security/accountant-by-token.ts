import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";
import {
  computeAutoStatus,
  computeRiskWeightedScore,
  computeExposureCents,
} from "@/lib/deadline-utils";
import { createHash } from "node:crypto";

type Deadline = Database["public"]["Tables"]["deadlines"]["Row"];

export type AccountantPortfolioLink = {
  token: string;
  business_id: string;
  business_name: string;
  score: number;
  overdue_count: number;
  exposure_cents: number;
  last_accessed_at: string | null;
};

export type AccountantPortalPayload = {
  connection: {
    id: string;
    business_id: string;
    accountant_email: string;
    accountant_name: string | null;
    created_at: string;
    expires_at: string;
  };
  business: {
    id: string;
    name: string;
    industry_slug: string | null;
    entity_type: string | null;
    employee_count: number | null;
  };
  deadlines: Deadline[];
  portfolio: AccountantPortfolioLink[];
  noteByDeadlineId: Record<string, string>;
};

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export async function loadAccountantPortalByToken(
  rawToken: string,
  viewer?: { ip?: string | null; userAgent?: string | null }
): Promise<AccountantPortalPayload | null> {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: connection } = await supabase
    .from("accountant_connections")
    .select("id, business_id, accountant_email, accountant_name, created_at, expires_at, revoked_at")
    .eq("token", rawToken)
    .maybeSingle();

  if (!connection) return null;
  if (connection.revoked_at) return null;
  if (new Date(connection.expires_at).getTime() < Date.now()) return null;

  const [
    ,
    { data: business },
    { data: deadlines },
    { data: otherRows },
    { data: noteRows },
    ,
  ] = await Promise.all([
    supabase
      .from("accountant_connections")
      .update({ last_accessed_at: nowIso })
      .eq("id", connection.id),
    supabase
      .from("businesses")
      .select("id, name, industry_slug, entity_type, employee_count")
      .eq("id", connection.business_id)
      .maybeSingle(),
    supabase
      .from("deadlines")
      .select("*")
      .eq("business_id", connection.business_id)
      .order("due_date", { ascending: true }),
    supabase
      .from("accountant_connections")
      .select("id, token, business_id, last_accessed_at, businesses!inner(name)")
      .eq("accountant_email", connection.accountant_email)
      .is("revoked_at", null)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: true }),
    supabase
      .from("accountant_deadline_notes")
      .select("deadline_id, note")
      .eq("accountant_token", rawToken),
    supabase.from("accountant_access_log").insert({
      connection_id: connection.id,
      ip_hash: hashIp(viewer?.ip ?? null),
      user_agent_fragment: (viewer?.userAgent ?? "").slice(0, 120) || null,
      action: "view",
    }),
  ]);

  if (!business) return null;

  type OtherRow = {
    id: string;
    token: string;
    business_id: string;
    last_accessed_at: string | null;
    businesses: { name: string } | { name: string }[];
  };

  // Hydrate portfolio scores in parallel — bounded by N (typically <50 clients
  // per accountant). Each row reads deadlines and derives score/exposure.
  const portfolioRows = (otherRows ?? []) as OtherRow[];
  const portfolio: AccountantPortfolioLink[] = await Promise.all(
    portfolioRows.map(async (row) => {
      const nm = Array.isArray(row.businesses)
        ? row.businesses[0]?.name
        : row.businesses?.name;
      const { data: ds } = await supabase
        .from("deadlines")
        .select("due_date, status, severity_tier, penalty_estimate_cents")
        .eq("business_id", row.business_id);
      // The DB stores status + severity_tier as TEXT with CHECK constraints
      // that exactly mirror the TS union types. The generated Database type
      // can't see the CHECK constraint, so we cast at the read boundary.
      const rows = (ds ?? []) as unknown as Parameters<typeof computeRiskWeightedScore>[0];
      const score = computeRiskWeightedScore(rows);
      const overdue_count = rows.filter(
        (d) => computeAutoStatus({ due_date: d.due_date, status: d.status }) === "overdue"
      ).length;
      const exposure_cents = computeExposureCents(rows);
      return {
        token: row.token,
        business_id: row.business_id,
        business_name: nm ?? "Unknown",
        score,
        overdue_count,
        exposure_cents,
        last_accessed_at: row.last_accessed_at,
      };
    })
  );

  const noteByDeadlineId: Record<string, string> = {};
  for (const row of noteRows ?? []) {
    if (row.deadline_id && row.note) noteByDeadlineId[row.deadline_id] = row.note;
  }

  return {
    connection: {
      id: connection.id,
      business_id: connection.business_id,
      accountant_email: connection.accountant_email,
      accountant_name: connection.accountant_name,
      // accountant_connections.created_at defaults to now() at DB level so
      // null is structurally impossible for any row we read here. The
      // generated Database type marks the column nullable because the
      // INSERT shape allows omitting it; coalesce for the read.
      created_at: connection.created_at ?? new Date(0).toISOString(),
      expires_at: connection.expires_at,
    },
    business,
    deadlines: deadlines ?? [],
    portfolio,
    noteByDeadlineId,
  };
}
