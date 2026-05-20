import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeadlineForm from "@/components/dashboard/DeadlineForm";
import DeleteDeadlineButton from "@/components/dashboard/DeleteDeadlineButton";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import { LinkButton } from "@/components/doctrine/Button";
import { Caption, Utility } from "@/components/doctrine";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageShell } from "@/components/doctrine/PageShell";

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
    <PageShell width="narrow">
      <Breadcrumb
        items={[
          { label: "Deadlines", href: "/deadlines" },
          { label: deadline.name, href: `/deadlines/${id}` },
          { label: "Edit" },
        ]}
      />
      <PageHeader
        title="Edit deadline"
        description={deadline.name}
        size="compact"
        actions={
          <LinkButton href={`/deadlines/${id}`} variant="ghost">
            ← Back
          </LinkButton>
        }
      />

      <DeadlineForm businessId={business.id} existing={deadline} />

      <div className="mt-5 pt-6 border-t-2 border-[var(--color-ground)] flex items-start justify-between flex-wrap gap-4">
        <div>
          <Utility>Danger zone</Utility>
          <Caption className="!mt-1">
            Removing a deadline also deletes its attached documents.
          </Caption>
        </div>
        <DeleteDeadlineButton deadlineId={deadline.id} />
      </div>
    </PageShell>
  );
}
