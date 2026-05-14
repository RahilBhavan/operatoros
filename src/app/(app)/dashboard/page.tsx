import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  FileText,
  Calendar,
  Download,
} from "lucide-react";
import type { Database } from "@/types/supabase";
import ShareLink from "@/components/dashboard/ShareLink";

type Deadline = Database["public"]["Tables"]["deadlines"]["Row"];

const STATUS_CONFIG = {
  overdue: {
    label: "Overdue",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
    icon: AlertTriangle,
  },
  in_progress: {
    label: "In Progress",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    dot: "bg-yellow-500",
    icon: Clock,
  },
  upcoming: {
    label: "Upcoming",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
    icon: Calendar,
  },
  compliant: {
    label: "Compliant",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
    icon: CheckCircle,
  },
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDueDate(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";
  if (days <= 30) return `Due in ${days} days`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function autoStatus(d: Deadline): Deadline["status"] {
  const days = daysUntil(d.due_date);
  if (d.status === "compliant") return "compliant";
  if (days < 0) return "overdue";
  if (days <= 30) return "in_progress";
  return "upcoming";
}

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

  const { data: allDeadlines } = await supabase
    .from("deadlines")
    .select("*")
    .eq("business_id", business.id)
    .order("due_date", { ascending: true });

  const deadlines = allDeadlines ?? [];

  const overdue = deadlines.filter((d) => autoStatus(d) === "overdue");
  const inProgress = deadlines.filter((d) => autoStatus(d) === "in_progress");
  const upcoming = deadlines.filter((d) => autoStatus(d) === "upcoming");
  const compliant = deadlines.filter((d) => d.status === "compliant");

  const complianceScore =
    deadlines.length === 0
      ? 100
      : Math.round(
          ((compliant.length + upcoming.length) / deadlines.length) * 100
        );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
          <p className="text-slate-500 mt-1">Compliance Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/pdf"
            target="_blank"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </a>
          <Link
            href="/deadlines/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Deadline
          </Link>
        </div>
      </div>

      {/* Share link */}
      <div className="mb-8">
        <ShareLink
          canShare={
            (business.billing_status === "active" ||
              business.billing_status === "trialing") &&
            (business.plan_tier === "growth" || business.plan_tier === "scale")
          }
        />
      </div>

      {/* Score + stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:col-span-2 lg:col-span-1">
          <p className="text-sm text-slate-500 mb-1">Compliance Score</p>
          <div
            className={`text-4xl font-extrabold ${
              complianceScore >= 80
                ? "text-green-600"
                : complianceScore >= 60
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {complianceScore}
            <span className="text-xl font-medium text-slate-400">/100</span>
          </div>
        </div>

        {(
          [
            { label: "Overdue", count: overdue.length, color: "text-red-600" },
            {
              label: "Due Soon",
              count: inProgress.length,
              color: "text-yellow-600",
            },
            {
              label: "Upcoming",
              count: upcoming.length,
              color: "text-blue-600",
            },
          ] as const
        ).map(({ label, count, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-200 p-5"
          >
            <p className="text-sm text-slate-500 mb-1">{label}</p>
            <div className={`text-4xl font-extrabold ${color}`}>{count}</div>
          </div>
        ))}
      </div>

      {/* Deadline groups */}
      {deadlines.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-6">
          {overdue.length > 0 && (
            <DeadlineGroup
              title="Overdue — Action Required"
              deadlines={overdue}
              statusKey="overdue"
            />
          )}
          {inProgress.length > 0 && (
            <DeadlineGroup
              title="Due Within 30 Days"
              deadlines={inProgress}
              statusKey="in_progress"
            />
          )}
          {upcoming.length > 0 && (
            <DeadlineGroup
              title="Upcoming"
              deadlines={upcoming}
              statusKey="upcoming"
            />
          )}
          {compliant.length > 0 && (
            <DeadlineGroup
              title="Compliant"
              deadlines={compliant}
              statusKey="compliant"
            />
          )}
        </div>
      )}
    </div>
  );
}

function DeadlineGroup({
  title,
  deadlines,
  statusKey,
}: {
  title: string;
  deadlines: Deadline[];
  statusKey: keyof typeof STATUS_CONFIG;
}) {
  const config = STATUS_CONFIG[statusKey];
  const Icon = config.icon;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${config.color}`} />
        <h2 className="text-sm font-semibold text-slate-700">
          {title} ({deadlines.length})
        </h2>
      </div>
      <div className="flex flex-col gap-2">
        {deadlines.map((d) => (
          <Link
            key={d.id}
            href={`/deadlines/${d.id}`}
            className={`flex items-center justify-between p-4 rounded-xl border ${config.border} ${config.bg} hover:opacity-90 transition-opacity`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`}
              />
              <div className="min-w-0">
                <div className={`font-medium ${config.color} truncate`}>
                  {d.name}
                </div>
                {d.governing_agency && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {d.governing_agency}
                  </div>
                )}
              </div>
            </div>
            <div
              className={`text-sm font-semibold ${config.color} shrink-0 ml-4`}
            >
              {formatDueDate(d.due_date)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-slate-700 mb-1">
        No deadlines yet
      </h3>
      <p className="text-slate-500 text-sm mb-5">
        Add your first compliance deadline to start tracking.
      </p>
      <Link
        href="/deadlines/new"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        Add your first deadline
      </Link>
    </div>
  );
}
