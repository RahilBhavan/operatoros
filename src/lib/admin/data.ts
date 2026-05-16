import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeAutoStatus,
  computeRiskWeightedScore,
  computeExposureCents,
} from "@/lib/deadline-utils";
import type { BusinessSummary, WaitlistRow, AuditEventRow } from "@/types/admin";

/**
 * Hydrate every business with its score, overdue count, and exposure. Uses
 * the service-role client (server-only) since admin views span all tenants.
 * For now we batch-fetch all deadlines for all businesses in one query —
 * fine up to a few thousand businesses; revisit with a materialized view at
 * scale.
 */
export async function loadBusinessSummaries(
  filter?: {
    plan_tier?: "free" | "business" | "accountant";
    billing_status?: string;
    state?: string;
    search?: string;
  }
): Promise<BusinessSummary[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("businesses")
    .select(
      "id, name, owner_id, plan_tier, billing_status, trial_ends_at, created_at, industry_slug, entity_type, employee_count"
    )
    .order("created_at", { ascending: false });

  if (filter?.plan_tier) query = query.eq("plan_tier", filter.plan_tier);
  if (filter?.billing_status) {
    const allowed = ["trialing", "active", "past_due", "canceled", "inactive"] as const;
    const bs = allowed.find((s) => s === filter.billing_status);
    if (bs) query = query.eq("billing_status", bs);
  }
  if (filter?.search) query = query.ilike("name", `%${filter.search}%`);

  const { data: businesses } = await query;
  if (!businesses?.length) return [];

  const ids = businesses.map((b) => b.id);
  const ownerIds = [...new Set(businesses.map((b) => b.owner_id))];

  const [{ data: locs }, { data: deadlines }] = await Promise.all([
    supabase.from("locations").select("business_id, state").in("business_id", ids),
    supabase
      .from("deadlines")
      .select("business_id, status, due_date, severity_tier, penalty_estimate_cents")
      .in("business_id", ids),
  ]);

  const stateByBiz = new Map<string, string>();
  for (const l of locs ?? []) {
    if (!stateByBiz.has(l.business_id) && l.state) stateByBiz.set(l.business_id, l.state);
  }

  const dlByBiz = new Map<string, typeof deadlines>();
  for (const d of deadlines ?? []) {
    const arr = dlByBiz.get(d.business_id) ?? [];
    arr.push(d);
    dlByBiz.set(d.business_id, arr);
  }

  const emailByOwner = new Map<string, string | null>();
  await Promise.all(
    ownerIds.map(async (oid) => {
      const { data } = await supabase.auth.admin.getUserById(oid);
      emailByOwner.set(oid, data?.user?.email ?? null);
    })
  );

  const rows: BusinessSummary[] = businesses.map((b) => {
    const ds = dlByBiz.get(b.id) ?? [];
    const overdue = ds.filter(
      (d) => computeAutoStatus({ due_date: d.due_date, status: d.status }) === "overdue"
    ).length;
    const score = computeRiskWeightedScore(ds);
    const exposure = computeExposureCents(ds);
    return {
      id: b.id,
      name: b.name,
      owner_id: b.owner_id,
      owner_email: emailByOwner.get(b.owner_id) ?? null,
      plan_tier: b.plan_tier,
      billing_status: b.billing_status,
      trial_ends_at: b.trial_ends_at,
      created_at: b.created_at,
      state: stateByBiz.get(b.id) ?? null,
      industry_slug: b.industry_slug,
      entity_type: b.entity_type,
      employee_count: b.employee_count,
      deadline_count: ds.length,
      overdue_count: overdue,
      risk_weighted_score: score,
      exposure_cents: exposure,
    };
  });

  if (filter?.state) {
    return rows.filter((r) => r.state === filter.state);
  }
  return rows;
}

export async function loadWaitlist(filter?: { state?: string; search?: string }): Promise<WaitlistRow[]> {
  const supabase = createAdminClient();
  let q = supabase
    .from("waitlist_signups")
    .select(
      "id, email, state, industry_slug, signed_up_at, utm_source, utm_campaign, referrer, referral_code, referred_by_code, confirmation_sent_at, invited_at"
    )
    .order("signed_up_at", { ascending: false });
  if (filter?.state) q = q.eq("state", filter.state);
  if (filter?.search) q = q.ilike("email", `%${filter.search}%`);
  const { data } = await q;
  return data ?? [];
}

export async function loadAuditStream(
  limit = 100,
  filter?: { event_type?: string; business_id?: string }
): Promise<AuditEventRow[]> {
  const supabase = createAdminClient();
  let q = supabase
    .from("audit_events")
    .select("id, business_id, actor_user_id, event_type, target_id, metadata, occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (filter?.event_type) q = q.eq("event_type", filter.event_type);
  if (filter?.business_id) q = q.eq("business_id", filter.business_id);

  const { data: events } = await q;
  if (!events?.length) return [];

  // business_id is nullable for platform-level events; only query for the
  // non-null IDs and tolerate missing rows in the name lookup.
  const bizIds = [
    ...new Set(events.map((e) => e.business_id).filter((v): v is string => !!v)),
  ];
  const actorIds = [...new Set(events.map((e) => e.actor_user_id).filter(Boolean) as string[])];

  const [{ data: businesses }] = await Promise.all([
    bizIds.length > 0
      ? supabase.from("businesses").select("id, name").in("id", bizIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

  const bizName = new Map((businesses ?? []).map((b) => [b.id, b.name]));
  const actorEmail = new Map<string, string | null>();
  await Promise.all(
    actorIds.map(async (uid) => {
      const { data } = await supabase.auth.admin.getUserById(uid);
      actorEmail.set(uid, data?.user?.email ?? null);
    })
  );

  return events.map((e) => ({
    id: e.id,
    business_id: e.business_id,
    business_name: e.business_id ? bizName.get(e.business_id) ?? null : null,
    actor_user_id: e.actor_user_id,
    actor_email: e.actor_user_id ? actorEmail.get(e.actor_user_id) ?? null : null,
    event_type: e.event_type,
    target_id: e.target_id,
    metadata: e.metadata as Record<string, unknown>,
    occurred_at: e.occurred_at,
  }));
}

export type AdminKpis = {
  total_businesses: number;
  paying: number;
  trialing: number;
  past_due: number;
  total_deadlines: number;
  overdue_deadlines: number;
  total_exposure_cents: number;
  total_waitlist: number;
  waitlist_uninvited: number;
  signups_last_7d: number;
  mrr_cents: number;
  by_plan: Record<string, number>;
  top_states: Array<{ state: string; count: number }>;
};

export async function loadKpis(): Promise<AdminKpis> {
  const supabase = createAdminClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: businesses },
    { data: deadlines },
    { data: waitlist },
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, plan_tier, billing_status, created_at"),
    supabase
      .from("deadlines")
      .select("status, due_date, severity_tier, penalty_estimate_cents"),
    supabase
      .from("waitlist_signups")
      .select("state, invited_at"),
  ]);

  const bizes = businesses ?? [];
  const ds = deadlines ?? [];
  const wls = waitlist ?? [];

  const paying = bizes.filter(
    (b) => b.billing_status === "active" && b.plan_tier !== "free"
  ).length;
  const trialing = bizes.filter((b) => b.billing_status === "trialing").length;
  const pastDue = bizes.filter((b) => b.billing_status === "past_due").length;
  const overdue = ds.filter(
    (d) => computeAutoStatus({ due_date: d.due_date, status: d.status }) === "overdue"
  ).length;
  const exposure = computeExposureCents(ds);
  const signupsLast7 = bizes.filter(
    (b) => new Date(b.created_at).toISOString() >= sevenDaysAgo
  ).length;

  // Plan-tier counts.
  const byPlan: Record<string, number> = {};
  for (const b of bizes) byPlan[b.plan_tier] = (byPlan[b.plan_tier] ?? 0) + 1;

  // Top waitlist states.
  const stateCounts = new Map<string, number>();
  for (const w of wls) {
    if (!w.state) continue;
    stateCounts.set(w.state, (stateCounts.get(w.state) ?? 0) + 1);
  }
  const topStates = [...stateCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([state, count]) => ({ state, count }));

  // Naive MRR: count active subs × tier price. Real numbers come from Stripe;
  // this is the "approximate" view for the dashboard.
  const PRICE_CENTS: Record<string, number> = {
    business: 7900,
    accountant: 29900,
    free: 0,
  };
  let mrr = 0;
  for (const b of bizes) {
    if (b.billing_status !== "active") continue;
    mrr += PRICE_CENTS[b.plan_tier] ?? 0;
  }

  return {
    total_businesses: bizes.length,
    paying,
    trialing,
    past_due: pastDue,
    total_deadlines: ds.length,
    overdue_deadlines: overdue,
    total_exposure_cents: exposure,
    total_waitlist: wls.length,
    waitlist_uninvited: wls.filter((w) => !w.invited_at).length,
    signups_last_7d: signupsLast7,
    mrr_cents: mrr,
    by_plan: byPlan,
    top_states: topStates,
  };
}
