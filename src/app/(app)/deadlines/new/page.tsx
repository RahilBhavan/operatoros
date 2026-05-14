import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeadlineForm from "@/components/dashboard/DeadlineForm";

export default async function NewDeadlinePage() {
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

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Add Deadline</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Add a compliance deadline to track and receive reminders for.
        </p>
      </div>
      <DeadlineForm businessId={business.id} />
    </div>
  );
}
