// Usage snapshot for the /billing usage tile. Pulls what we can count from
// Postgres without an additional Stripe round-trip:
//   • Team members — count of memberships where status='active' + the owner.
//   • Documents tracked — count of documents for this business.
//   • Deadlines tracked — count of deadlines for this business.
//
// Document storage in bytes isn't tracked at the row level (the `documents`
// table has no file_size column today), so we don't render "X MB of Y GB" —
// just the count. If we ever add `file_size_bytes` to documents, this is
// where the storage-usage math lands.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { entitlementsFor } from "@/lib/entitlements";

export interface BillingUsage {
  teamMembers: { used: number; max: number };
  documents: number;
  deadlines: number;
  storageMib: { used: number | null; max: number };
}

export async function loadBillingUsage(
  supabase: SupabaseClient<Database>,
  businessId: string,
  planTier: string | null | undefined
): Promise<BillingUsage> {
  const ents = entitlementsFor(planTier);

  const [members, docs, dls] = await Promise.all([
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "active"),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("deadlines")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
  ]);

  // owner counts as 1; memberships is everyone else.
  const teamUsed = 1 + (members.count ?? 0);

  return {
    teamMembers: { used: teamUsed, max: ents.teamMemberMax },
    documents: docs.count ?? 0,
    deadlines: dls.count ?? 0,
    storageMib: { used: null, max: ents.storageCapMib },
  };
}
