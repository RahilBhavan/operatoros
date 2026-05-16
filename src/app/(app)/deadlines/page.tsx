import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeadlineFilters from "@/components/dashboard/DeadlineFilters";
import ConfidenceBadge from "@/components/dashboard/ConfidenceBadge";
import { loadRuleConfidence } from "@/lib/admin/data";
import type { Database } from "@/types/supabase";
import {
  H1,
  Body,
  Caption,
  Utility,
  Index,
  LinkButton,
} from "@/components/doctrine";

// regulatory_rule_id added in workstream A; supabase types haven't
// regenerated yet, so widen the runtime row here.
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

const STATUS_BADGE: Record<Deadline["status"], { label: string; classes: string }> = {
  overdue: {
    label: "OVERDUE",
    classes: "bg-[var(--color-mark)] text-[var(--color-field)] border-[var(--color-mark)]",
  },
  in_progress: {
    label: "DUE SOON",
    classes: "bg-[var(--color-ground)] text-[var(--color-field)] border-[var(--color-ground)]",
  },
  upcoming: {
    label: "UPCOMING",
    classes: "bg-transparent text-[var(--color-ground)] border-[var(--color-ground)]",
  },
  compliant: {
    label: "COMPLIANT",
    classes: "bg-[var(--color-field-soft)] text-[var(--color-ground)] border-[var(--color-ground)]",
  },
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

  const VALID_STATUSES: Deadline["status"][] = ["overdue", "in_progress", "upcoming", "compliant"];
  if (params.status && VALID_STATUSES.includes(params.status as Deadline["status"])) {
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
    <div>
      <header className="flex items-end justify-between border-b-2 border-[var(--color-ground)] pb-6 mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Index className="!text-[15px]">PA-DEADLINES</Index>
            <Utility className="opacity-60">REGISTRY</Utility>
          </div>
          <H1>All Deadlines.</H1>
          <Caption className="!mt-2 !text-[15px]">
            <Index className="!text-[15px]">{deadlines?.length ?? 0}</Index> total
            entries on file
          </Caption>
        </div>
        <LinkButton href="/deadlines/new" variant="mark">
          + File new deadline
        </LinkButton>
      </header>

      <DeadlineFilters currentStatus={params.status} currentType={params.type} />

      {deadlineRows.length > 0 ? (
        <div className="border-2 border-[var(--color-ground)]">
          {/* Column header */}
          <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-2.5 grid grid-cols-[1fr_auto_auto] gap-4 items-center">
            <Utility className="!text-[var(--color-field)] !opacity-80">DEADLINE / AGENCY</Utility>
            <Utility className="!text-[var(--color-field)] !opacity-80">STATUS</Utility>
            <Utility className="!text-[var(--color-field)] !opacity-80 hidden sm:block">DUE</Utility>
          </div>

          <ul className="bg-[var(--color-field)] divide-y divide-[var(--color-ground)]">
            {deadlineRows.map((d, idx) => {
              const badge = STATUS_BADGE[d.status];
              const confidence = d.regulatory_rule_id
                ? confidenceMap.get(d.regulatory_rule_id) ?? null
                : null;
              return (
                <li key={d.id}>
                  <Link
                    href={`/deadlines/${d.id}`}
                    className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-4 hover:bg-[var(--color-field-soft)] transition-colors"
                  >
                    <div className="min-w-0 flex items-baseline gap-3">
                      <Index className="!text-[12px] opacity-60 shrink-0 w-8">
                        {String(idx + 1).padStart(3, "0")}
                      </Index>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Body className="!font-bold truncate">{d.name}</Body>
                          <ConfidenceBadge confidence={confidence} />
                        </div>
                        <Caption className="!mt-0.5 !text-[12px]">
                          {(DEADLINE_TYPE_LABELS[d.deadline_type] ?? d.deadline_type).toUpperCase()}
                          {d.governing_agency ? (
                            <>
                              {" · "}
                              {d.governing_agency.toUpperCase()}
                            </>
                          ) : null}
                        </Caption>
                      </div>
                    </div>
                    <span
                      className={`border-2 px-2.5 py-1 t-utility !text-[12px] !tracking-[0.1em] shrink-0 ${badge.classes}`}
                    >
                      {badge.label}
                    </span>
                    <Index className="!text-[15px] shrink-0 hidden sm:block">
                      {new Date(d.due_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Index>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="border-2 border-[var(--color-ground)] py-16 px-6 text-center">
          <Index className="!text-[38px] !text-[var(--color-ground)] opacity-30 mb-3">
            000
          </Index>
          <Body className="mb-4">
            {params.status || params.type
              ? "No deadlines match your filters."
              : "No deadlines yet."}
          </Body>
          {!params.status && !params.type && (
            <LinkButton href="/deadlines/new" variant="ground">
              + File your first deadline
            </LinkButton>
          )}
        </div>
      )}
    </div>
  );
}
