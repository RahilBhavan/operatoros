import { notFound } from "next/navigation";
import { Shield } from "lucide-react";
import { loadShareViewByToken } from "@/lib/security/share-by-token";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await loadShareViewByToken(token);
  if (!data) notFound();

  const { business, deadlines, expires_at: expiresAt } = data;
  const now = new Date();

  function effectiveStatus(deadline: {
    due_date: string;
    status: string;
  }): "overdue" | "in_progress" | "upcoming" | "compliant" {
    if (deadline.status === "compliant") return "compliant";
    const days = Math.floor(
      (new Date(deadline.due_date).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (days < 0) return "overdue";
    if (days <= 30) return "in_progress";
    return "upcoming";
  }

  const rows = deadlines.map((d) => ({
    ...d,
    computed: effectiveStatus(d),
  }));

  const overdue = rows.filter((d) => d.computed === "overdue").length;
  const inProgress = rows.filter((d) => d.computed === "in_progress").length;
  const compliant = rows.filter((d) => d.computed === "compliant").length;
  const score =
    rows.length === 0
      ? 100
      : Math.round(
          ((compliant +
            rows.filter((d) => d.computed === "upcoming").length) /
            rows.length) *
            100
        );

  const STATUS_BADGE = {
    overdue: "bg-red-100 text-red-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    upcoming: "bg-blue-100 text-blue-700",
    compliant: "bg-green-100 text-green-700",
  };

  const STATUS_LABEL = {
    overdue: "Overdue",
    in_progress: "In Progress",
    upcoming: "Upcoming",
    compliant: "Compliant",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-900">OperatorOS</span>
          </div>
          <span className="text-xs text-slate-400">
            Read-only · Expires{" "}
            {new Date(expiresAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
          <p className="text-slate-500 mt-1">Compliance Overview</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
            <p className="text-3xl font-extrabold text-slate-900">{score}%</p>
            <p className="text-xs text-slate-500 mt-1">Compliance Score</p>
          </div>
          <div className="bg-white rounded-2xl border border-red-100 p-5 text-center">
            <p className="text-3xl font-extrabold text-red-600">{overdue}</p>
            <p className="text-xs text-slate-500 mt-1">Overdue</p>
          </div>
          <div className="bg-white rounded-2xl border border-yellow-100 p-5 text-center">
            <p className="text-3xl font-extrabold text-yellow-600">
              {inProgress}
            </p>
            <p className="text-xs text-slate-500 mt-1">Due Soon</p>
          </div>
          <div className="bg-white rounded-2xl border border-green-100 p-5 text-center">
            <p className="text-3xl font-extrabold text-green-600">{compliant}</p>
            <p className="text-xs text-slate-500 mt-1">Compliant</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">
              All Deadlines ({rows.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {rows.map((d) => (
              <div
                key={d.id}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{d.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {d.governing_agency ?? d.deadline_type} ·{" "}
                    {new Date(d.due_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[d.computed]}`}
                >
                  {STATUS_LABEL[d.computed]}
                </span>
              </div>
            ))}
            {rows.length === 0 && (
              <p className="px-6 py-8 text-center text-slate-400 text-sm">
                No deadlines to display.
              </p>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center mt-6">
          Powered by{" "}
          <a
            href={process.env.NEXT_PUBLIC_APP_URL}
            className="text-blue-500 hover:underline"
          >
            OperatorOS
          </a>
        </p>
      </main>
    </div>
  );
}
