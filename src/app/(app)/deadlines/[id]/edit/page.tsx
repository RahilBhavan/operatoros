import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import DeadlineForm from "@/components/dashboard/DeadlineForm";
import DeleteDeadlineButton from "@/components/dashboard/DeleteDeadlineButton";

export default async function EditDeadlinePage({
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

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/deadlines/${id}`}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit Deadline</h1>
        <DeleteDeadlineButton deadlineId={deadline.id} />
      </div>

      <DeadlineForm businessId={business.id} existing={deadline} />
    </div>
  );
}
