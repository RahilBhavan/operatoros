import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, Filter } from "lucide-react";
import DeadlineFilters from "@/components/dashboard/DeadlineFilters";
import type { Database } from "@/types/supabase";

type Deadline = Database["public"]["Tables"]["deadlines"]["Row"];

const DEADLINE_TYPE_LABELS: Record<string, string> = {
  business_license: "Business License",
  employee_cert: "Employee Certification",
  coi: "Certificate of Insurance",
  entity_filing: "Entity Filing",
  equipment_inspection: "Equipment Inspection",
  tax: "Tax Deadline",
  other: "Other",
};

const STATUS_COLORS: Record<Deadline["status"], string> = {
  overdue: "bg-red-100 text-red-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  upcoming: "bg-blue-100 text-blue-700",
  compliant: "bg-green-100 text-green-700",
};

function statusLabel(s: Deadline["status"]): string {
  const map: Record<Deadline["status"], string> = {
    overdue: "Overdue",
    in_progress: "Due Soon",
    upcoming: "Upcoming",
    compliant: "Compliant",
  };
  return map[s];
}

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Deadlines</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {deadlines?.length ?? 0} total
          </p>
        </div>
        <Link
          href="/deadlines/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Deadline
        </Link>
      </div>

      <DeadlineFilters currentStatus={params.status} currentType={params.type} />

      {deadlines && deadlines.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {deadlines.map((d, idx) => (
            <Link
              key={d.id}
              href={`/deadlines/${d.id}`}
              className={`flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors ${
                idx > 0 ? "border-t border-slate-100" : ""
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">
                    {d.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">
                      {DEADLINE_TYPE_LABELS[d.deadline_type] ?? d.deadline_type}
                    </span>
                    {d.governing_agency && (
                      <>
                        <span className="text-slate-200">·</span>
                        <span className="text-xs text-slate-400">
                          {d.governing_agency}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[d.status]}`}
                >
                  {statusLabel(d.status)}
                </span>
                <span className="text-sm text-slate-600 hidden sm:block">
                  {new Date(d.due_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Filter className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {params.status || params.type
              ? "No deadlines match your filters."
              : "No deadlines yet."}
          </p>
          {!params.status && !params.type && (
            <Link
              href="/deadlines/new"
              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm mt-3"
            >
              <Plus className="w-4 h-4" />
              Add your first deadline
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
