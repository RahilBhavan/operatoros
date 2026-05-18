import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeadlineFilters from "@/components/dashboard/DeadlineFilters";
import ConfidenceBadge from "@/components/dashboard/ConfidenceBadge";
import { loadRuleConfidence } from "@/lib/admin/data";
import type { Database } from "@/types/supabase";
import { LinkButton } from "@/components/doctrine/Button";
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
  in_progress: "Due ≤ 30d",
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
    <div className="flex flex-col gap-8">
      <header className="flex items-end justify-between border-b-4 border-[var(--color-ground)] pb-5 flex-wrap gap-4">
        <div>
          <div className="t-utility mb-2">Manifest · all routes</div>
          <h1
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 900,
              fontSize: "clamp(36px, 5vw, 56px)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            Deadlines
          </h1>
          <div className="t-utility mt-3">
            <span className="text-[var(--color-mark)]">
              {String(deadlineRows.length).padStart(3, "0")}
            </span>{" "}
            entries on file
          </div>
        </div>
        <LinkButton href="/deadlines/new" variant="mark">
          + File new deadline
        </LinkButton>
      </header>

      <DeadlineFilters currentStatus={params.status} currentType={params.type} />

      {deadlineRows.length > 0 ? (
        <div className="border-2 border-[var(--color-ground)]">
          <div className="panel-ink px-5 py-3 grid grid-cols-[1fr_auto_auto] gap-4 items-center">
            <span
              className="t-utility"
              style={{ color: "var(--color-field)" }}
            >
              Deadline · agency
            </span>
            <span
              className="t-utility"
              style={{ color: "var(--color-field)" }}
            >
              Status
            </span>
            <span
              className="t-utility hidden sm:block"
              style={{ color: "var(--color-field)" }}
            >
              Due
            </span>
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
                    className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-4 hover:bg-[var(--color-ground)] hover:text-[var(--color-field)] no-underline group"
                  >
                    <div className="min-w-0 flex items-baseline gap-3">
                      <span
                        className="t-utility shrink-0 w-10 text-[var(--color-mark)] group-hover:text-[var(--color-field)]"
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
                        <div className="t-utility mt-1">
                          {(
                            DEADLINE_TYPE_LABELS[d.deadline_type] ??
                            d.deadline_type
                          ).toUpperCase()}
                          {d.governing_agency ? (
                            <> · {d.governing_agency.toUpperCase()}</>
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
        </div>
      ) : (
        <div className="border-2 border-[var(--color-ground)] p-10 flex flex-col gap-4 items-start">
          <StampChip tone="field">No matches</StampChip>
          <h2
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 800,
              fontSize: 32,
              lineHeight: 1.05,
              letterSpacing: "-0.015em",
              textTransform: "uppercase",
            }}
          >
            {params.status || params.type
              ? "No deadlines match these filters."
              : "Empty manifest."}
          </h2>
          {!params.status && !params.type ? (
            <LinkButton href="/deadlines/new" variant="ground">
              + File your first deadline
            </LinkButton>
          ) : (
            <Link href="/deadlines" className="t-link">
              Clear filters →
            </Link>
          )}
        </div>
      )}

      <div className="t-utility text-[var(--color-ground)] flex items-center justify-between">
        <span>Showing {deadlineRows.length} of {deadlineRows.length}</span>
        <span>
          Last verified · {new Date().toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
