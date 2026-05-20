import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeadlineForm from "@/components/dashboard/DeadlineForm";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import { LinkButton } from "@/components/doctrine/Button";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageShell } from "@/components/doctrine/PageShell";

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
    <PageShell width="narrow">
      <Breadcrumb
        items={[
          { label: "Deadlines", href: "/deadlines" },
          { label: "Add deadline" },
        ]}
      />
      <PageHeader
        title="Add deadline"
        description="Track a compliance due date and get reminders."
        size="compact"
        actions={
          <LinkButton href="/deadlines" variant="ghost">
            ← All deadlines
          </LinkButton>
        }
      />
      <DeadlineForm businessId={business.id} />
    </PageShell>
  );
}
