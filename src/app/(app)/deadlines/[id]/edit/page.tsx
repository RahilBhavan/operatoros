import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeadlineForm from "@/components/dashboard/DeadlineForm";
import DeleteDeadlineButton from "@/components/dashboard/DeleteDeadlineButton";
import {
  H1,
  Caption,
  Utility,
  Index,
  LinkButton,
} from "@/components/doctrine";

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
      <header className="flex items-end justify-between border-b-4 border-[var(--color-ground)] pb-3 mb-5 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Index className="!text-[15px]">PA-DL-EDIT</Index>
            <Utility className="">REGISTRY · AMEND</Utility>
          </div>
          <H1>Edit deadline.</H1>
          <Caption className="!mt-2">{deadline.name}</Caption>
        </div>
        <LinkButton href={`/deadlines/${id}`} variant="ghost">
          ← Back
        </LinkButton>
      </header>

      <DeadlineForm businessId={business.id} existing={deadline} />

      <div className="mt-8 pt-6 border-t-2 border-[var(--color-ground)] flex items-start justify-between flex-wrap gap-4">
        <div>
          <Utility>DANGER ZONE</Utility>
          <Caption className="!mt-1">
            Removing a deadline also deletes its attached documents.
          </Caption>
        </div>
        <DeleteDeadlineButton deadlineId={deadline.id} />
      </div>
    </div>
  );
}
