import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeadlineForm from "@/components/dashboard/DeadlineForm";
import {
  H1,
  Caption,
  Utility,
  Index,
  LinkButton,
} from "@/components/doctrine";

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
      <header className="flex items-end justify-between border-b-2 border-[var(--color-ground)] pb-6 mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Index className="!text-[15px]">PA-DL-NEW</Index>
            <Utility className="">REGISTRY · INTAKE</Utility>
          </div>
          <H1>Add deadline.</H1>
          <Caption className="!mt-2">
            File a compliance deadline for tracking and reminders.
          </Caption>
        </div>
        <LinkButton href="/deadlines" variant="ghost">
          ← All deadlines
        </LinkButton>
      </header>
      <DeadlineForm businessId={business.id} />
    </div>
  );
}
