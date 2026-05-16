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
import {
  formatDueDate,
  computeAutoStatus,
  computeRiskWeightedScore,
  computeExposureCents,
  topActions,
  formatCents,
} from "@/lib/deadline-utils";
import {
  Destination,
  H2,
  Body,
  Caption,
  Utility,
  Index,
  LinkButton,
} from "@/components/doctrine";

type Deadline = Database["public"]["Tables"]["deadlines"]["Row"];

type StatusKey = "overdue" | "in_progress" | "upcoming" | "compliant";

const STATUS: Record<StatusKey, { label: string; sort: string; rule: string }> = {
  overdue: { label: "OVERDUE — ACTION REQUIRED", sort: "X", rule: "border-[var(--color-mark)]" },
  in_progress: { label: "DUE WITHIN 30 DAYS", sort: "A", rule: "border-[var(--color-ground)]" },
  upcoming: { label: "UPCOMING", sort: "B", rule: "border-[var(--color-ground)]" },
  compliant: { label: "COMPLIANT", sort: "C", rule: "border-[var(--color-ground)]" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, plan_tier, billing_status")
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

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

  const deadlines = allDeadlines ?? [];
  const history = scoreHistory ?? [];

  const overdue = deadlines.filter((d) => computeAutoStatus(d) === "overdue");
  const inProgress = deadlines.filter((d) => computeAutoStatus(d) === "in_progress");
  const upcoming = deadlines.filter((d) => computeAutoStatus(d) === "upcoming");
  const compliant = deadlines.filter((d) => d.status === "compliant");

  const complianceScore = computeRiskWeightedScore(deadlines);
  const exposureCents = computeExposureCents(deadlines);
  const actions = topActions(deadlines, 3);
  const peer = await getPeerContext(supabase, business.id, complianceScore);
  const isPremium =
    (business.billing_status === "active" ||
      business.billing_status === "trialing") &&
    (business.plan_tier === "business" || business.plan_tier === "accountant");

  return (
    <div>
      {/* Header — the master luggage tag for this business */}
      <header className="border-2 border-[var(--color-ground)] mb-8">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-6 pt-5 pb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <Index className="!text-[var(--color-field)] !text-[15px] opacity-80">
              PA-{business.id.slice(0, 6).toUpperCase()}
            </Index>
            <span className="tag-tab -mt-6">DASHBOARD</span>
            <Utility className="opacity-80">SECTOR · A</Utility>
          </div>
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <Utility className="!text-[var(--color-field)] opacity-70 mb-2">
                FINAL DESTINATION
              </Utility>
              <Destination className="!text-[var(--color-field)] !text-[60px] !leading-[0.95]">
                {business.name.toUpperCase()}
              </Destination>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/api/export/pdf"
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost !text-[var(--color-field)] !border-[var(--color-field)] hover:!bg-[var(--color-field)] hover:!text-[var(--color-ground)]"
              >
                Export PDF
              </a>
              <LinkButton href="/deadlines/new" variant="mark">
                + File new deadline
              </LinkButton>
            </div>
          </div>
        </div>

        {/* Score strip */}
        <div className="bg-[var(--color-field)] grid grid-cols-2 sm:grid-cols-4 divide-x-2 divide-[var(--color-ground)]">
          <ScoreCell
            label="RISK-WEIGHTED SCORE"
            value={`${complianceScore}`}
            suffix="/100"
            extra={
              exposureCents > 0 ? (
                <Caption className="!text-[var(--color-mark)] !text-[12px] !mt-1">
                  {formatCents(exposureCents)} exposure
                </Caption>
              ) : null
            }
            big
          />
          <ScoreCell label="OVERDUE" value={`${overdue.length}`} mark={overdue.length > 0} />
          <ScoreCell label="DUE SOON" value={`${inProgress.length}`} />
          <ScoreCell label="UPCOMING" value={`${upcoming.length}`} />
        </div>
      </header>

      {/* Share + accountant tools */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <ShareLink canShare={isPremium} />
        <AccountantInvite canInvite={isPremium} />
      </div>

      {/* Top actions */}
      {actions.length > 0 && (
        <section className="border-2 border-[var(--color-ground)] mb-8">
          <div className="bg-[var(--color-mark)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between flex-wrap gap-2">
            <Utility className="!text-[var(--color-field)] !opacity-100">
              TOP {actions.length} ACTION{actions.length === 1 ? "" : "S"} TO RECOVER SCORE
            </Utility>
            <Caption className="!text-[var(--color-field)] !opacity-80 !text-[12px]">
              SEVERITY × URGENCY
            </Caption>
          </div>
          <ol className="bg-[var(--color-field)] divide-y divide-[var(--color-ground)]">
            {actions.map((a, i) => (
              <li key={a.id ?? a.name}>
                <Link
                  href={a.id ? `/deadlines/${a.id}` : "/deadlines"}
                  className="flex items-center gap-5 px-5 py-4 hover:bg-[var(--color-field-soft)] transition-colors"
                >
                  <Index className="!text-[24px] shrink-0 w-10">
                    {String(i + 1).padStart(2, "0")}
                  </Index>
                  <div className="flex-1 min-w-0">
                    <Body className="!font-bold truncate">{a.name}</Body>
                    <Caption className="!mt-1 !text-[12px]">
                      {a.status === "overdue" ? "OVERDUE" : "DUE SOON"} ·{" "}
                      {a.severity_tier?.toUpperCase()} SEVERITY
                      {a.penalty_estimate_cents > 0 ? (
                        <>
                          {" "}
                          ·{" "}
                          <Index className="!text-[12px]">
                            {formatCents(a.penalty_estimate_cents)}
                          </Index>{" "}
                          POTENTIAL PENALTY
                        </>
                      ) : null}
                    </Caption>
                  </div>
                  <Utility className="opacity-60 shrink-0">→</Utility>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Score chart + insights */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <ComplianceScoreChart history={history} currentScore={complianceScore} />
        <ProactiveInsights />
      </div>

      {/* Peer benchmark — industry × state cohort */}
      <div className="mb-10">
        <PeerBenchmarkBar peer={peer} />
      </div>

      {/* Deadline groups */}
      {deadlines.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-10">
          {overdue.length > 0 && (
            <DeadlineGroup statusKey="overdue" deadlines={overdue} />
          )}
          {inProgress.length > 0 && (
            <DeadlineGroup statusKey="in_progress" deadlines={inProgress} />
          )}
          {upcoming.length > 0 && (
            <DeadlineGroup statusKey="upcoming" deadlines={upcoming} />
          )}
          {compliant.length > 0 && (
            <DeadlineGroup statusKey="compliant" deadlines={compliant} />
          )}
        </div>
      )}
    </div>
  );
}

function ScoreCell({
  label,
  value,
  suffix,
  extra,
  big,
  mark,
}: {
  label: string;
  value: string;
  suffix?: string;
  extra?: React.ReactNode;
  big?: boolean;
  mark?: boolean;
}) {
  return (
    <div className="px-5 py-5">
      <Utility className="opacity-60 mb-2">{label}</Utility>
      <div className={big ? "t-display !text-[38px]" : "t-h1"}>
        <span className={mark ? "text-[var(--color-mark)]" : ""}>{value}</span>
        {suffix && (
          <span className="t-h3 !opacity-50 ml-1">{suffix}</span>
        )}
      </div>
      {extra}
    </div>
  );
}

function DeadlineGroup({
  statusKey,
  deadlines,
}: {
  statusKey: StatusKey;
  deadlines: Deadline[];
}) {
  const conf = STATUS[statusKey];
  const overdue = statusKey === "overdue";

  return (
    <section className={`border-2 ${conf.rule}`}>
      <header
        className={`flex items-center justify-between px-5 py-3 ${
          overdue
            ? "bg-[var(--color-mark)] text-[var(--color-field)]"
            : "bg-[var(--color-ground)] text-[var(--color-field)]"
        }`}
      >
        <div className="flex items-center gap-3">
          <Utility className="!text-[var(--color-field)] !opacity-100">
            {conf.label}
          </Utility>
          <Index className="!text-[var(--color-field)] !text-[12px] opacity-80">
            ({deadlines.length})
          </Index>
        </div>
        <span className="inline-flex items-stretch border-2 border-[var(--color-field)]">
          <span className="px-2 py-0.5 border-r-2 border-[var(--color-field)] t-utility !text-[12px]">
            SORT
          </span>
          <span className="px-2 py-0.5 t-h3 leading-none">{conf.sort}</span>
        </span>
      </header>
      <ul className="bg-[var(--color-field)] divide-y divide-[var(--color-ground)]">
        {deadlines.map((d) => (
          <li key={d.id}>
            <Link
              href={`/deadlines/${d.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-[var(--color-field-soft)] transition-colors gap-4"
            >
              <div className="min-w-0 flex-1">
                <Body className="!font-bold truncate">{d.name}</Body>
                {d.governing_agency && (
                  <Caption className="!mt-0.5 !text-[12px]">
                    {d.governing_agency.toUpperCase()}
                  </Caption>
                )}
              </div>
              <Index className={`shrink-0 ${overdue ? "" : "!text-[var(--color-ground)]"}`}>
                {formatDueDate(d.due_date)}
              </Index>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="border-2 border-[var(--color-ground)] py-16 px-6 text-center">
      <Index className="!text-[48px] !text-[var(--color-ground)] opacity-30 mb-3">
        000
      </Index>
      <H2 className="mb-2">No deadlines yet.</H2>
      <Body className="!opacity-70 mb-6">
        Add your first compliance deadline to start tracking.
      </Body>
      <LinkButton href="/deadlines/new" variant="ground">
        + File your first deadline
      </LinkButton>
    </div>
  );
}
