import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeadlineFilters from "@/components/dashboard/DeadlineFilters";
import ConfidenceBadge from "@/components/dashboard/ConfidenceBadge";
import { loadRuleConfidence } from "@/lib/admin/data";
import type { Database } from "@/types/supabase";
import { LinkButton } from "@/components/doctrine/Button";
import { PageEmptyState } from "@/components/doctrine/PageEmptyState";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageSection } from "@/components/doctrine/PageSection";
import { PageShell } from "@/components/doctrine/PageShell";
import { StampChip } from "@/components/doctrine/StampChip";

type Deadline = Database["public"]["Tables"]["deadlines"]["Row"] & {
  regulatory_rule_id?: string | null;
};

const DEADLINE_TYPE_LABELS: Record<string, string> = {
  business_license: "Business License",
  employee_cert: "Employee Cert",
  coi: "COI",
  entity_filing: "Entity Filing",
  equipment_inspection: "Inspection",
  tax: "Tax",
  other: "Other",
};

type StatusKey = Deadline["status"];

const STATUS_CHIP: Record<StatusKey, "mark" | "ground" | "field"> = {
  overdue: "mark",
  in_progress: "ground",
  upcoming: "field",
  compliant: "field",
};

const STATUS_LABEL: Record<StatusKey, string> = {
  overdue: "Overdue",
  in_progress: "Due ≤ 30 days",
  upcoming: "Upcoming",
  compliant: "Compliant",
};

export default async function DeadlinesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  let query = supabase
    .from("deadlines")
    .select("*")
    .eq("business_id", business.id)
    .order("due_date", { ascending: true });

  const VALID_STATUSES: Deadline["status"][] = [
    "overdue",
    "in_progress",
    "upcoming",
    "compliant",
  ];
  if (
    params.status &&
    VALID_STATUSES.includes(params.status as Deadline["status"])
  ) {
    query = query.eq("status", params.status as Deadline["status"]);
  }
  if (params.type) {
    query = query.eq("deadline_type", params.type);
  }

  const { data: deadlines } = await query;
  const deadlineRows = (deadlines ?? []) as Deadline[];
  const ruleIds = deadlineRows
    .map((d) => d.regulatory_rule_id)
    .filter((x): x is string => !!x);
  const confidenceMap = await loadRuleConfidence([...new Set(ruleIds)]);

  return (
    <PageShell>
      <PageHeader
        code={`${deadlineRows.length} deadline${deadlineRows.length === 1 ? "" : "s"}`}
        title="Deadlines"
        description="Every obligation you're tracking. Filter by status or type, then open a row to update proof or due dates."
        actions={
          <LinkButton href="/deadlines/new" variant="mark" size="sm">
            + Add deadline
          </LinkButton>
        }
      />

      <DeadlineFilters currentStatus={params.status} currentType={params.type} />

      {deadlineRows.length > 0 ? (
        <PageSection
          title="All deadlines"
          count={deadlineRows.length}
          subtitle="Tap a row to open details, upload proof, or edit the due date"
        >
          <div
            className="hidden sm:grid panel-ink px-4 py-2 grid-cols-[1fr_auto_auto] gap-4 items-center border-b-2 border-[var(--color-ground)]"
            aria-hidden
          >
            <span className="t-utility text-[var(--color-field)]">Deadline</span>
            <span className="t-utility text-[var(--color-field)]">Status</span>
            <span className="t-utility text-[var(--color-field)]">Due date</span>
          </div>
          <ul className="bg-[var(--color-field)]">
            {deadlineRows.map((d, idx) => {
              const confidence = d.regulatory_rule_id
                ? confidenceMap.get(d.regulatory_rule_id) ?? null
                : null;
              const last = idx === deadlineRows.length - 1;
              return (
                <li
                  key={d.id}
                  className={last ? "" : "border-b border-[var(--color-ground)]"}
                >
                  <Link
                    href={`/deadlines/${d.id}`}
                    className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-2.5 hover:bg-[var(--color-ground)] hover:text-[var(--color-field)] no-underline group"
                  >
                    <div className="min-w-0 flex items-baseline gap-3">
                      <span
                        className="t-utility shrink-0 w-10 text-[var(--color-mark)] group-hover:text-[var(--color-field)] tabular-nums"
                      >
                        {String(idx + 1).padStart(3, "0")}
                      </span>
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
                        <div className="t-utility mt-0.5">
                          {DEADLINE_TYPE_LABELS[d.deadline_type] ??
                            d.deadline_type}
                          {d.governing_agency ? (
                            <> · {d.governing_agency}</>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <StampChip tone={STATUS_CHIP[d.status]}>
                      {STATUS_LABEL[d.status]}
                    </StampChip>
                    <span
                      className="hidden sm:block shrink-0 font-bold text-[15px]"
                      style={{
                        fontFamily: "var(--font-index)",
                      }}
                    >
                      {new Date(d.due_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </PageSection>
      ) : (
        <PageEmptyState
          chip={<StampChip tone="field">No matches</StampChip>}
          title={
            params.status || params.type
              ? "No deadlines match these filters"
              : "No deadlines yet"
          }
          description={
            params.status || params.type
              ? "Try clearing filters or add a new deadline."
              : undefined
          }
          actions={
            !params.status && !params.type ? (
              <LinkButton href="/deadlines/new" variant="ground">
                + Add your first deadline
              </LinkButton>
            ) : (
              <Link href="/deadlines" className="t-link">
                Clear filters →
              </Link>
            )
          }
        />
      )}

      {deadlineRows.length > 0 ? (
        <p className="t-caption text-[var(--color-ground)]/75">
          {deadlineRows.length} result{deadlineRows.length === 1 ? "" : "s"}
        </p>
      ) : null}
    </PageShell>
  );
}
