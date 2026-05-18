import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import ShareLink from "@/components/dashboard/ShareLink";
import AccountantInvite from "@/components/dashboard/AccountantInvite";
import ComplianceScoreChart from "@/components/dashboard/ComplianceScoreChart";
import ProactiveInsights from "@/components/dashboard/ProactiveInsights";
import PeerBenchmarkBar from "@/components/dashboard/PeerBenchmarkBar";
import { getPeerContext } from "@/lib/benchmarks";
import ConfidenceBadge from "@/components/dashboard/ConfidenceBadge";
import { loadRuleConfidence, type RuleConfidenceRow } from "@/lib/admin/data";
import {
  formatDueDate,
  computeAutoStatus,
  computeRiskWeightedScore,
  computeExposureCents,
  topActions,
  formatCents,
} from "@/lib/deadline-utils";
import { LinkButton } from "@/components/doctrine/Button";
import { StampChip } from "@/components/doctrine/StampChip";
import { KpiCard } from "@/components/doctrine/KpiCard";
import StateCoverageBanner from "@/components/dashboard/StateCoverageBanner";
import { EXPLICITLY_HANDLED_STATES } from "@/lib/regulatory-graph";

type Deadline = Database["public"]["Tables"]["deadlines"]["Row"] & {
  regulatory_rule_id?: string | null;
};

type StatusKey = "overdue" | "in_progress" | "upcoming" | "compliant";

const STATUS_LABEL: Record<StatusKey, string> = {
  overdue: "Overdue · action required",
  in_progress: "Due within 30 days",
  upcoming: "Upcoming",
  compliant: "Compliant · this year",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, plan_tier, billing_status, industry_slug")
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  // Primary location state — used to decide whether to show the
  // template-fallback banner (WS-0.4).
  const { data: locationRow } = await supabase
    .from("locations")
    .select("state")
    .eq("business_id", business.id)
    .limit(1)
    .maybeSingle();

  const primaryState = locationRow?.state ?? null;
  const isTemplateFallbackState =
    primaryState != null &&
    !(EXPLICITLY_HANDLED_STATES as readonly string[]).includes(primaryState);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [{ data: allDeadlines }, { data: scoreHistory }] = await Promise.all([
    supabase
      .from("deadlines")
      .select("*")
      .eq("business_id", business.id)
      .order("due_date", { ascending: true }),
    supabase
      .from("compliance_score_history")
      .select("score, recorded_at")
      .eq("business_id", business.id)
      .gte("recorded_at", ninetyDaysAgo.toISOString())
      .order("recorded_at", { ascending: true }),
  ]);

  const deadlines = (allDeadlines ?? []) as Deadline[];
  const history = scoreHistory ?? [];
  const ruleIds = deadlines
    .map((d) => d.regulatory_rule_id)
    .filter((x): x is string => !!x);
  const confidenceMap = await loadRuleConfidence([...new Set(ruleIds)]);

  const overdue = deadlines.filter((d) => computeAutoStatus(d) === "overdue");
  const inProgress = deadlines.filter(
    (d) => computeAutoStatus(d) === "in_progress",
  );
  const upcoming = deadlines.filter((d) => computeAutoStatus(d) === "upcoming");
  const compliant = deadlines.filter((d) => d.status === "compliant");

  const complianceScore = computeRiskWeightedScore(deadlines);
  const exposureCents = computeExposureCents(deadlines);
  const actions = topActions(deadlines, 5);
  const peer = await getPeerContext(supabase, business.id, complianceScore);
  const isPremium =
    (business.billing_status === "active" ||
      business.billing_status === "trialing") &&
    (business.plan_tier === "business" || business.plan_tier === "accountant");

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <header>
        <div className="flex items-end justify-between flex-wrap gap-4 pb-5 border-b-4 border-[var(--color-ground)]">
          <div>
            <div className="t-utility mb-2">Final destination</div>
            <h1
              style={{
                fontFamily: "var(--font-destination)",
                fontWeight: 900,
                fontSize: "clamp(36px, 5vw, 56px)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                color: "var(--color-ground)",
              }}
            >
              {business.name}
            </h1>
            <div className="t-utility mt-3 text-[var(--color-ground)]">
              {deadlines.length} on file ·{" "}
              <span className="text-[var(--color-mark)]">
                PA-{business.id.slice(0, 6).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <a
              href="/api/export/pdf"
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
            >
              ↓ Export PDF
            </a>
            <LinkButton href="/deadlines/new" variant="mark">
              + File deadline
            </LinkButton>
          </div>
        </div>
      </header>

      {/* State-coverage transparency banner — only when the user's primary
          state isn't in the deeply-curated set (WS-0.4). */}
      {isTemplateFallbackState && primaryState ? (
        <StateCoverageBanner
          state={primaryState}
          industrySlug={business.industry_slug ?? null}
        />
      ) : null}

      {/* Next 5 actions — promoted to first-fold per buyer-panel WS-0.1.
          Operators in the 100-business panel wanted a list with confirmation
          affordance, not a 0-100 score, as their daily anchor. */}
      {actions.length > 0 ? (
        <section className="border-2 border-[var(--color-ground)]">
          <div className="bg-[var(--color-mark)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between flex-wrap gap-2">
            <span
              className="t-utility"
              style={{ color: "var(--color-field)" }}
            >
              Next {actions.length} action{actions.length === 1 ? "" : "s"}
            </span>
            <span
              className="t-utility"
              style={{ color: "var(--color-field)" }}
            >
              Severity × urgency
            </span>
          </div>
          <ol className="bg-[var(--color-field)]">
            {actions.map((a, i) => (
              <li
                key={a.id ?? a.name}
                className={
                  i === actions.length - 1
                    ? ""
                    : "border-b border-[var(--color-ground)]"
                }
              >
                <div className="flex items-center gap-5 px-5 py-4 hover:bg-[var(--color-ground)]/5">
                  <span
                    className="font-black leading-none w-10 shrink-0 text-[var(--color-mark)]"
                    style={{
                      fontFamily: "var(--font-destination)",
                      fontSize: 28,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={a.id ? `/deadlines/${a.id}` : "/deadlines"}
                      className="font-bold text-[15px] truncate block no-underline hover:underline"
                      style={{ fontFamily: "var(--font-index)" }}
                    >
                      {a.name}
                    </Link>
                    <div className="t-utility mt-1">
                      {a.status === "overdue" ? "Overdue" : "Due soon"} ·{" "}
                      {a.severity_tier?.toUpperCase()} severity
                      {a.penalty_estimate_cents > 0 ? (
                        <>
                          {" "}· {formatCents(a.penalty_estimate_cents)} potential penalty
                        </>
                      ) : null}
                    </div>
                  </div>
                  <Link
                    href={a.id ? `/deadlines/${a.id}/edit` : "/deadlines"}
                    className="t-utility shrink-0 text-[var(--color-mark)] hover:underline"
                  >
                    Log filing →
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* Counters row (score moved here, demoted from hero per WS-0.1) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          tone={overdue.length > 0 ? "mark" : "field"}
          label="Overdue"
          value={overdue.length}
          sub={overdue.length > 0 ? "Action required" : "All clear"}
        />
        <KpiCard tone="field" label="Due soon" value={inProgress.length} sub="≤ 30 days" />
        <KpiCard tone="field" label="Upcoming" value={upcoming.length} sub="Next 6 months" />
        <KpiCard
          tone="field"
          label="Score"
          value={complianceScore}
          suffix="/100"
          sub={
            exposureCents > 0 ? `${formatCents(exposureCents)} exposure` : "On target"
          }
        />
      </div>

      {/* Share / accountant tools */}
      <div className="grid sm:grid-cols-2 gap-4">
        <ShareLink canShare={isPremium} />
        <AccountantInvite canInvite={isPremium} />
      </div>

      {/* Trend + insights (score history kept here for context, no longer hero) */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <ComplianceScoreChart history={history} currentScore={complianceScore} />
        <ProactiveInsights />
      </div>

      {/* Peer benchmark */}
      <PeerBenchmarkBar peer={peer} />

      {/* Deadline groups */}
      {deadlines.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-8">
          {overdue.length > 0 && (
            <DeadlineGroup
              statusKey="overdue"
              deadlines={overdue}
              confidenceMap={confidenceMap}
            />
          )}
          {inProgress.length > 0 && (
            <DeadlineGroup
              statusKey="in_progress"
              deadlines={inProgress}
              confidenceMap={confidenceMap}
            />
          )}
          {upcoming.length > 0 && (
            <DeadlineGroup
              statusKey="upcoming"
              deadlines={upcoming}
              confidenceMap={confidenceMap}
            />
          )}
          {compliant.length > 0 && (
            <DeadlineGroup
              statusKey="compliant"
              deadlines={compliant}
              confidenceMap={confidenceMap}
            />
          )}
        </div>
      )}
    </div>
  );
}

function DeadlineGroup({
  statusKey,
  deadlines,
  confidenceMap,
}: {
  statusKey: StatusKey;
  deadlines: Deadline[];
  confidenceMap: Map<string, RuleConfidenceRow>;
}) {
  const overdue = statusKey === "overdue";
  return (
    <section className="border-2 border-[var(--color-ground)]">
      <header
        className={`flex items-center justify-between px-5 py-3 ${
          overdue ? "bg-[var(--color-mark)]" : "panel-ink"
        }`}
      >
        <span
          className="t-utility"
          style={{ color: "var(--color-field)" }}
        >
          {STATUS_LABEL[statusKey]}
        </span>
        <span
          className="t-utility"
          style={{ color: "var(--color-field)" }}
        >
          {String(deadlines.length).padStart(2, "0")}
        </span>
      </header>
      <ul className="bg-[var(--color-field)]">
        {deadlines.map((d, i) => {
          const confidence = d.regulatory_rule_id
            ? confidenceMap.get(d.regulatory_rule_id) ?? null
            : null;
          const last = i === deadlines.length - 1;
          return (
            <li
              key={d.id}
              className={last ? "" : "border-b border-[var(--color-ground)]"}
            >
              <Link
                href={`/deadlines/${d.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 hover:bg-[var(--color-ground)] hover:text-[var(--color-field)] no-underline group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-bold text-[15px] truncate"
                      style={{ fontFamily: "var(--font-index)" }}
                    >
                      {d.name}
                    </span>
                    <ConfidenceBadge confidence={confidence} />
                  </div>
                  {d.governing_agency ? (
                    <div className="t-utility mt-1">
                      {d.governing_agency}
                    </div>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 font-bold ${
                    overdue
                      ? "text-[var(--color-field)]"
                      : "text-[var(--color-mark)] group-hover:text-[var(--color-field)]"
                  }`}
                  style={{
                    fontFamily: "var(--font-index)",
                    fontSize: 15,
                  }}
                >
                  {formatDueDate(d.due_date)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="border-2 border-[var(--color-ground)] p-10 flex flex-col gap-4 items-start">
      <StampChip tone="field">Empty manifest</StampChip>
      <h2
        style={{
          fontFamily: "var(--font-destination)",
          fontWeight: 800,
          fontSize: 38,
          lineHeight: 1.05,
          letterSpacing: "-0.015em",
          textTransform: "uppercase",
        }}
      >
        No deadlines on file.
      </h2>
      <p
        className="max-w-[480px] text-[15px]"
        style={{ fontFamily: "var(--font-index)" }}
      >
        Add your first compliance deadline to start tracking. Or revisit
        onboarding to pre-populate from your industry and state.
      </p>
      <LinkButton href="/deadlines/new" variant="mark">
        + File first deadline
      </LinkButton>
    </div>
  );
}
