import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Pencil, CheckCircle } from "lucide-react";
import MarkCompliantButton from "@/components/dashboard/MarkCompliantButton";
import DocumentUpload from "@/components/dashboard/DocumentUpload";
import type { Database } from "@/types/supabase";

type Deadline = Database["public"]["Tables"]["deadlines"]["Row"];
type Document = Database["public"]["Tables"]["documents"]["Row"];

const STATUS_CONFIG: Record<
  Deadline["status"],
  { label: string; color: string; bg: string }
> = {
  overdue: { label: "Overdue", color: "text-red-700", bg: "bg-red-100" },
  in_progress: {
    label: "Due Soon",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
  },
  upcoming: { label: "Upcoming", color: "text-blue-700", bg: "bg-blue-100" },
  compliant: {
    label: "Compliant",
    color: "text-green-700",
    bg: "bg-green-100",
  },
};

const FREQ_LABELS: Record<string, string> = {
  annual: "Annual",
  biennial: "Every 2 years",
  quarterly: "Quarterly",
  one_time: "One-time",
};

export default async function DeadlineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: deadline } = await supabase
    .from("deadlines")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (!deadline) notFound();

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("deadline_id", id)
    .order("uploaded_at", { ascending: false });

  const statusConfig = STATUS_CONFIG[deadline.status];
  const dueDate = new Date(deadline.due_date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/deadlines"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          All Deadlines
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-slate-900">{deadline.name}</h1>
          <Link
            href={`/deadlines/${id}/edit`}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 shrink-0"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}
          >
            {statusConfig.label}
          </span>
          <span className="text-xs text-slate-400 px-2.5 py-1 bg-slate-100 rounded-full capitalize">
            {FREQ_LABELS[deadline.frequency] ?? deadline.frequency}
          </span>
          <span className="text-xs text-slate-400 px-2.5 py-1 bg-slate-100 rounded-full capitalize">
            {deadline.deadline_type.replace(/_/g, " ")}
          </span>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <Row label="Due date" value={dueDate} />
          {deadline.governing_agency && (
            <Row label="Governing agency" value={deadline.governing_agency} />
          )}
          {deadline.description && (
            <div>
              <span className="text-slate-500 block mb-1">Description</span>
              <p className="text-slate-700 leading-relaxed">
                {deadline.description}
              </p>
            </div>
          )}
        </div>

        {deadline.status !== "compliant" && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <MarkCompliantButton deadlineId={deadline.id} />
          </div>
        )}

        {deadline.status === "compliant" && (
          <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Marked compliant
            </span>
          </div>
        )}
      </div>

      {/* Documents */}
      <DocumentUpload
        deadlineId={deadline.id}
        businessId={business.id}
        userId={user.id}
        existingDocuments={documents ?? []}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-500 w-36 shrink-0">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}
