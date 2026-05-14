import { notFound } from "next/navigation";
import Link from "next/link";
import { Shield, Users } from "lucide-react";
import { computeAutoStatus, computeComplianceScore } from "@/lib/deadline-utils";
import { loadAccountantPortalByToken } from "@/lib/security/accountant-by-token";
import type { Database } from "@/types/supabase";
import DeadlineNote from "./DeadlineNote";

type Deadline = Database["public"]["Tables"]["deadlines"]["Row"];

const STATUS_CONFIG = {
  overdue: { label: "Overdue", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
  in_progress: { label: "Due Soon", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-500" },
  upcoming: { label: "Upcoming", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
  compliant: { label: "Compliant", color: "text-green-700", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
};

export default async function AccountantPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const payload = await loadAccountantPortalByToken(token);
  if (!payload) notFound();

  const { connection, business, deadlines: allDeadlines, portfolio, noteByDeadlineId } =
    payload;

  const notesByDeadline = new Map<string, string>(Object.entries(noteByDeadlineId));

  const score = computeComplianceScore(allDeadlines, computeAutoStatus);

  const overdue = allDeadlines.filter((d) => computeAutoStatus(d) === "overdue");
  const inProgress = allDeadlines.filter((d) => computeAutoStatus(d) === "in_progress");
  const upcoming = allDeadlines.filter((d) => computeAutoStatus(d) === "upcoming");
  const compliant = allDeadlines.filter((d) => d.status === "compliant");

  const scoreColor =
    score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-900">OperatorOS</span>
            <span className="text-slate-300 mx-2">·</span>
            <span className="text-sm text-slate-500">Accountant View</span>
          </div>
          <div className="text-xs text-slate-400">
            Read-only · Live data
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Portfolio sidebar strip — shown when accountant has multiple clients */}
        {portfolio.length > 0 && (
          <div className="mb-6 bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">
                Your other clients on OperatorOS ({portfolio.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {portfolio.map((c) => (
                  <Link
                    key={c.token}
                    href={`/accountant/${c.token}`}
                    className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium text-slate-600 transition-colors"
                  >
                    {c.business_name}
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Business info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
            {business.entity_type && (
              <span className="capitalize">{business.entity_type.replace(/_/g, " ")}</span>
            )}
            {business.employee_count && (
              <>
                <span className="text-slate-300">·</span>
                <span>{business.employee_count} employees</span>
              </>
            )}
            <span className="text-slate-300">·</span>
            <span>Shared {new Date(connection.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
          </div>
        </div>

        {/* Score + stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:col-span-2 lg:col-span-1">
            <p className="text-sm text-slate-500 mb-1">Compliance Score</p>
            <div className={`text-4xl font-extrabold ${scoreColor}`}>
              {score}
              <span className="text-xl font-medium text-slate-400">/100</span>
            </div>
          </div>

          {[
            { label: "Overdue", count: overdue.length, color: "text-red-600" },
            { label: "Due Soon", count: inProgress.length, color: "text-yellow-600" },
            { label: "Compliant", count: compliant.length, color: "text-green-600" },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500 mb-1">{label}</p>
              <div className={`text-4xl font-extrabold ${color}`}>{count}</div>
            </div>
          ))}
        </div>

        {/* Deadline groups */}
        {allDeadlines.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500">No deadlines on record.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {overdue.length > 0 && (
              <DeadlineGroup title="Overdue — Action Required" deadlines={overdue} statusKey="overdue" token={token} notesByDeadline={notesByDeadline} />
            )}
            {inProgress.length > 0 && (
              <DeadlineGroup title="Due Within 30 Days" deadlines={inProgress} statusKey="in_progress" token={token} notesByDeadline={notesByDeadline} />
            )}
            {upcoming.length > 0 && (
              <DeadlineGroup title="Upcoming" deadlines={upcoming} statusKey="upcoming" token={token} notesByDeadline={notesByDeadline} />
            )}
            {compliant.length > 0 && (
              <DeadlineGroup title="Compliant" deadlines={compliant} statusKey="compliant" token={token} notesByDeadline={notesByDeadline} />
            )}
          </div>
        )}

        <p className="text-xs text-slate-400 text-center mt-8">
          Powered by <strong>OperatorOS</strong> · Data updates in real time · Notes are private to this accountant view
        </p>
        <p className="text-xs text-slate-300 text-center mt-2 max-w-2xl mx-auto">
          Compliance calendar data is auto-generated based on business profile and is provided for reference only.
          Always verify filing requirements with the relevant agency or a licensed professional before relying on any deadline.
          OperatorOS does not provide legal, tax, or accounting advice.
        </p>
      </main>
    </div>
  );
}

function DeadlineGroup({
  title,
  deadlines,
  statusKey,
  token,
  notesByDeadline,
}: {
  title: string;
  deadlines: Deadline[];
  statusKey: keyof typeof STATUS_CONFIG;
  token: string;
  notesByDeadline: Map<string, string>;
}) {
  const config = STATUS_CONFIG[statusKey];

  return (
    <div>
      <h2 className={`text-sm font-semibold mb-3 ${config.color}`}>
        {title} ({deadlines.length})
      </h2>
      <div className="flex flex-col gap-2">
        {deadlines.map((d) => (
          <div
            key={d.id}
            className={`p-4 rounded-xl border ${config.border} ${config.bg}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} />
                <div className="min-w-0">
                  <div className={`font-medium ${config.color} truncate`}>{d.name}</div>
                  {d.governing_agency && (
                    <div className="text-xs text-slate-500 mt-0.5">{d.governing_agency}</div>
                  )}
                </div>
              </div>
              <div className={`text-sm font-semibold ${config.color} shrink-0 ml-4`}>
                {new Date(d.due_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
            <DeadlineNote
              deadlineId={d.id}
              token={token}
              existingNote={notesByDeadline.get(d.id) ?? null}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
