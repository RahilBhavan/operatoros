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
    plan_tier?: "free" | "lite" | "business" | "accountant";
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
  mrr_source: "stripe" | "approximate";
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

  // WS-F — MRR pulled from the Stripe-mirror table when populated. Falls
  // back to the legacy plan_tier × price approximation when no rows are
  // present (e.g. before the backfill script runs against a new project),
  // and surfaces which path produced the number so the UI can label it.
  let mrr = 0;
  let mrrSource: "stripe" | "approximate" = "approximate";
  const { data: stripeSubs } = await supabase
    .from("stripe_subscriptions")
    .select("unit_amount_cents, status")
    .in("status", ["active", "trialing"]);
  if (stripeSubs && stripeSubs.length > 0) {
    mrr = stripeSubs.reduce(
      (acc, s) => acc + (s.unit_amount_cents ?? 0),
      0
    );
    mrrSource = "stripe";
  } else {
    const PRICE_CENTS: Record<string, number> = {
      business: 7900,
      accountant: 29900,
      lite: 1900,
      free: 0,
    };
    for (const b of bizes) {
      if (b.billing_status !== "active") continue;
      mrr += PRICE_CENTS[b.plan_tier] ?? 0;
    }
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
    mrr_source: mrrSource,
    by_plan: byPlan,
    top_states: topStates,
  };
}

// ─── Regulatory rules (Workstream A) ─────────────────────────────────────────

export type RegulatoryRuleRow = {
  id: string;
  jurisdiction_type: "federal" | "state" | "local";
  jurisdiction_code: string;
  industry_slug: string | null;
  rule_key: string;
  name: string;
  description: string;
  deadline_type: string;
  governing_agency: string;
  frequency: string;
  severity_tier: "critical" | "high" | "medium" | "low" | "info";
  penalty_estimate_cents: number | null;
  source_url: string | null;
  statute_citation: string | null;
  due_date_rule: unknown;
  applies_when: unknown;
  effective_date: string;
  sunset_date: string | null;
  version: number;
  superseded_by: string | null;
  last_verified_at: string | null;
  last_verified_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RegulatoryRuleStats = {
  total: number;
  by_jurisdiction: Record<"federal" | "state" | "local", number>;
  verified_recent: number;   // last_verified_at within 30 days
  stale: number;             // last_verified_at older than 180 days
  unverified: number;        // last_verified_at IS NULL
  state_coverage: Array<{ state: string; count: number }>;
  missing_states: string[];  // states with zero rules in regulatory_rules
};

const ALL_STATES_FOR_COVERAGE = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const RULE_COLS =
  "id, jurisdiction_type, jurisdiction_code, industry_slug, rule_key, name, " +
  "description, deadline_type, governing_agency, frequency, severity_tier, " +
  "penalty_estimate_cents, source_url, statute_citation, due_date_rule, " +
  "applies_when, effective_date, sunset_date, version, superseded_by, " +
  "last_verified_at, last_verified_by, created_at, updated_at";

// regulatory_rules isn't in the generated Database type yet (types regenerate
// from the live DB after migration apply); cast through `unknown` so we get
// the right shape back without leaking `any` into call sites.
type RulesQuery = {
  data: RegulatoryRuleRow[] | null;
  error: { message: string } | null;
};
type RuleQuery = {
  data: RegulatoryRuleRow | null;
  error: { message: string } | null;
};

export async function loadRegulatoryRules(filter?: {
  jurisdiction_type?: "federal" | "state" | "local";
  verification?: "verified" | "stale" | "unverified" | "all";
}): Promise<RegulatoryRuleRow[]> {
  const supabase = createAdminClient();
  // Always exclude superseded rows from the canonical list — one head per
  // (jurisdiction, industry, rule_key) chain. History remains readable via
  // direct id navigation through the rule detail page.
  const q = (supabase
    .from("regulatory_rules" as never) as unknown as {
      select: (cols: string) => {
        is: (col: string, val: null) => {
          eq: (col: string, val: string) => {
            order: (col: string, opts: { ascending: boolean }) => Promise<RulesQuery>;
          };
          order: (col: string, opts: { ascending: boolean }) => Promise<RulesQuery>;
        };
      };
    })
    .select(RULE_COLS)
    .is("superseded_by", null);

  const promise = filter?.jurisdiction_type
    ? q.eq("jurisdiction_type", filter.jurisdiction_type).order("rule_key", { ascending: true })
    : q.order("rule_key", { ascending: true });

  const { data } = await promise;
  let rows = data ?? [];

  if (filter?.verification === "verified") {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    rows = rows.filter(
      (r) => r.last_verified_at && new Date(r.last_verified_at).getTime() >= cutoff
    );
  } else if (filter?.verification === "stale") {
    const cutoff = Date.now() - 180 * 24 * 60 * 60 * 1000;
    rows = rows.filter(
      (r) => r.last_verified_at && new Date(r.last_verified_at).getTime() < cutoff
    );
  } else if (filter?.verification === "unverified") {
    rows = rows.filter((r) => !r.last_verified_at);
  }

  return rows;
}

export async function loadRegulatoryRule(id: string): Promise<RegulatoryRuleRow | null> {
  const supabase = createAdminClient();
  const { data } = await ((supabase.from("regulatory_rules" as never) as unknown as {
    select: (cols: string) => {
      eq: (col: string, val: string) => { maybeSingle: () => Promise<RuleQuery> };
    };
  })
    .select(RULE_COLS)
    .eq("id", id)
    .maybeSingle());
  return data;
}

export async function loadRegulatoryRuleStats(): Promise<RegulatoryRuleStats> {
  const rows = await loadRegulatoryRules();
  const now = Date.now();
  const recentCutoff = now - 30 * 24 * 60 * 60 * 1000;
  const staleCutoff = now - 180 * 24 * 60 * 60 * 1000;

  const by_jurisdiction = { federal: 0, state: 0, local: 0 };
  let verified_recent = 0;
  let stale = 0;
  let unverified = 0;
  const state_coverage_map = new Map<string, number>();

  for (const r of rows) {
    by_jurisdiction[r.jurisdiction_type] += 1;
    if (!r.last_verified_at) unverified += 1;
    else {
      const t = new Date(r.last_verified_at).getTime();
      if (t >= recentCutoff) verified_recent += 1;
      else if (t < staleCutoff) stale += 1;
    }
    if (r.jurisdiction_type === "state" && r.jurisdiction_code !== "*") {
      state_coverage_map.set(
        r.jurisdiction_code,
        (state_coverage_map.get(r.jurisdiction_code) ?? 0) + 1
      );
    }
  }

  const state_coverage = [...state_coverage_map.entries()]
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => a.state.localeCompare(b.state));
  const covered = new Set(state_coverage_map.keys());
  const missing_states = ALL_STATES_FOR_COVERAGE.filter((s) => !covered.has(s));

  return {
    total: rows.length,
    by_jurisdiction,
    verified_recent,
    stale,
    unverified,
    state_coverage,
    missing_states,
  };
}

// ─── Peer benchmarks (Workstream C) ──────────────────────────────────────────

export type NetworkDensity = {
  cohorts_at_threshold: number;
  businesses_covered: number;
  newest_cohort_at: string | null;
  top_cohorts: Array<{
    industry_slug: string;
    state_code: string;
    cohort_size: number;
  }>;
};

/**
 * Reads the public.industry_benchmarks materialized view to surface how
 * dense the per-(industry × state) cohort coverage is. Only cohorts that
 * have crossed the k-anonymity threshold (>=10 businesses) appear in the
 * view at all, so these numbers track real network growth.
 */
export async function loadNetworkDensity(): Promise<NetworkDensity> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("industry_benchmarks")
    .select("industry_slug, state_code, cohort_size, last_captured_at")
    .order("cohort_size", { ascending: false });

  const rows = data ?? [];
  const businessesCovered = rows.reduce((sum, r) => sum + r.cohort_size, 0);
  const newestCohortAt = rows.reduce<string | null>((acc, r) => {
    if (!r.last_captured_at) return acc;
    if (!acc || r.last_captured_at > acc) return r.last_captured_at;
    return acc;
  }, null);

  return {
    cohorts_at_threshold: rows.length,
    businesses_covered: businessesCovered,
    newest_cohort_at: newestCohortAt,
    top_cohorts: rows.slice(0, 5).map((r) => ({
      industry_slug: r.industry_slug,
      state_code: r.state_code,
      cohort_size: r.cohort_size,
    })),
  };
}

// ─── Rule corrections (Workstream B) ─────────────────────────────────────────

export type CorrectionStatus = "pending" | "accepted" | "rejected" | "superseded";

export type CorrectionRow = {
  id: string;
  rule_id: string;
  proposed_by_connection_id: string | null;
  proposed_by_user_id: string | null;
  proposed_by_kind: "accountant" | "admin" | "business_member";
  proposed_changes: Record<string, unknown>;
  rationale: string;
  citation_url: string | null;
  status: CorrectionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  resulting_rule_id: string | null;
  created_at: string;
};

export type CorrectionQueueRow = CorrectionRow & {
  rule_name: string;
  rule_key: string;
  rule_severity: RegulatoryRuleRow["severity_tier"];
  rule_jurisdiction_code: string;
  rule_jurisdiction_type: RegulatoryRuleRow["jurisdiction_type"];
  proposer_email: string | null; // accountant connection email when available
};

const CORRECTION_COLS =
  "id, rule_id, proposed_by_connection_id, proposed_by_user_id, " +
  "proposed_by_kind, proposed_changes, rationale, citation_url, status, " +
  "reviewed_by, reviewed_at, review_note, resulting_rule_id, created_at";

// Loads pending corrections sorted by rule severity DESC then created_at DESC,
// joined to the rule + accountant connection so the queue UI can render
// without N+1 queries.
export async function loadCorrectionQueue(filter?: {
  status?: CorrectionStatus;
}): Promise<CorrectionQueueRow[]> {
  const supabase = createAdminClient();
  const status = filter?.status ?? "pending";

  const corrQ = supabase
    .from("rule_corrections" as never) as unknown as {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        order: (col: string, opts: { ascending: boolean }) => Promise<{
          data: CorrectionRow[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
  const { data: corrections } = await corrQ
    .select(CORRECTION_COLS)
    .eq("status", status)
    .order("created_at", { ascending: false });

  const rows = corrections ?? [];
  if (rows.length === 0) return [];

  const ruleIds = [...new Set(rows.map((r) => r.rule_id))];
  const connectionIds = [
    ...new Set(rows.map((r) => r.proposed_by_connection_id).filter((x): x is string => !!x)),
  ];

  const rulesRead = supabase.from("regulatory_rules" as never) as unknown as {
    select: (cols: string) => {
      in: (col: string, vals: string[]) => Promise<{
        data: Array<Pick<
          RegulatoryRuleRow,
          "id" | "name" | "rule_key" | "severity_tier" | "jurisdiction_code" | "jurisdiction_type"
        >> | null;
      }>;
    };
  };
  const [{ data: rules }, connsResult] = await Promise.all([
    rulesRead
      .select("id, name, rule_key, severity_tier, jurisdiction_code, jurisdiction_type")
      .in("id", ruleIds),
    connectionIds.length
      ? supabase
          .from("accountant_connections")
          .select("id, accountant_email")
          .in("id", connectionIds)
      : Promise.resolve({ data: [] as Array<{ id: string; accountant_email: string }> }),
  ]);
  const conns =
    "data" in connsResult ? connsResult.data : ([] as Array<{ id: string; accountant_email: string }>);

  const ruleById = new Map((rules ?? []).map((r) => [r.id, r]));
  const emailByConn = new Map(
    (conns ?? []).map((c) => [c.id, c.accountant_email])
  );

  const SEVERITY_ORDER: Record<RegulatoryRuleRow["severity_tier"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };

  return rows
    .map((c) => {
      const rule = ruleById.get(c.rule_id);
      return {
        ...c,
        rule_name: rule?.name ?? "(unknown rule)",
        rule_key: rule?.rule_key ?? "",
        rule_severity: rule?.severity_tier ?? "info",
        rule_jurisdiction_code: rule?.jurisdiction_code ?? "",
        rule_jurisdiction_type: rule?.jurisdiction_type ?? "federal",
        proposer_email:
          c.proposed_by_connection_id != null
            ? emailByConn.get(c.proposed_by_connection_id) ?? null
            : null,
      } satisfies CorrectionQueueRow;
    })
    .sort((a, b) => {
      const sevDiff = SEVERITY_ORDER[a.rule_severity] - SEVERITY_ORDER[b.rule_severity];
      if (sevDiff !== 0) return sevDiff;
      return b.created_at.localeCompare(a.created_at);
    });
}

export async function loadCorrection(id: string): Promise<CorrectionQueueRow | null> {
  const supabase = createAdminClient();
  const single = supabase.from("rule_corrections" as never) as unknown as {
    select: (cols: string) => {
      eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: CorrectionRow | null }> };
    };
  };
  const { data: correction } = await single.select(CORRECTION_COLS).eq("id", id).maybeSingle();
  if (!correction) return null;

  const ruleRead = supabase.from("regulatory_rules" as never) as unknown as {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{
          data: Pick<
            RegulatoryRuleRow,
            "id" | "name" | "rule_key" | "severity_tier" | "jurisdiction_code" | "jurisdiction_type"
          > | null;
        }>;
      };
    };
  };
  const { data: rule } = await ruleRead
    .select("id, name, rule_key, severity_tier, jurisdiction_code, jurisdiction_type")
    .eq("id", correction.rule_id)
    .maybeSingle();

  let proposerEmail: string | null = null;
  if (correction.proposed_by_connection_id) {
    const { data: conn } = await supabase
      .from("accountant_connections")
      .select("accountant_email")
      .eq("id", correction.proposed_by_connection_id)
      .maybeSingle();
    proposerEmail = conn?.accountant_email ?? null;
  }

  return {
    ...correction,
    rule_name: rule?.name ?? "(unknown rule)",
    rule_key: rule?.rule_key ?? "",
    rule_severity: rule?.severity_tier ?? "info",
    rule_jurisdiction_code: rule?.jurisdiction_code ?? "",
    rule_jurisdiction_type: rule?.jurisdiction_type ?? "federal",
    proposer_email: proposerEmail,
  };
}

export type CorrectionStats = {
  pending: number;
  accepted: number;
  rejected: number;
};

export async function loadCorrectionStats(): Promise<CorrectionStats> {
  const supabase = createAdminClient();
  // One count per status. head:true makes Supabase return only the count.
  const counts = await Promise.all(
    (["pending", "accepted", "rejected"] as const).map(async (s) => {
      const q = supabase.from("rule_corrections" as never) as unknown as {
        select: (cols: string, opts: { count: "exact"; head: true }) => {
          eq: (col: string, val: string) => Promise<{ count: number | null }>;
        };
      };
      const { count } = await q.select("id", { count: "exact", head: true }).eq("status", s);
      return [s, count ?? 0] as const;
    })
  );
  const map = Object.fromEntries(counts) as Record<"pending" | "accepted" | "rejected", number>;
  return { pending: map.pending, accepted: map.accepted, rejected: map.rejected };
}

export type RuleConfidenceRow = {
  rule_id: string;
  confidence_tier: "low" | "unverified" | "stale" | "community_validated" | "baseline";
  accepted_corrections: number;
  pending_corrections: number;
  rejected_corrections: number;
  last_verified_at: string | null;
};

export async function loadRuleConfidence(ruleIds: string[]): Promise<Map<string, RuleConfidenceRow>> {
  if (ruleIds.length === 0) return new Map();
  const supabase = createAdminClient();
  const q = supabase.from("rule_confidence" as never) as unknown as {
    select: (cols: string) => {
      in: (col: string, vals: string[]) => Promise<{ data: RuleConfidenceRow[] | null }>;
    };
  };
  const { data } = await q
    .select(
      "rule_id, confidence_tier, accepted_corrections, pending_corrections, rejected_corrections, last_verified_at"
    )
    .in("rule_id", ruleIds);
  const map = new Map<string, RuleConfidenceRow>();
  for (const r of data ?? []) map.set(r.rule_id, r);
  return map;
}
