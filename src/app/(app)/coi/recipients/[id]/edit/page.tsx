import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditCoiRecipientForm from "@/components/coi/EditCoiRecipientForm";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageShell } from "@/components/doctrine/PageShell";

export const dynamic = "force-dynamic";

export default async function EditCoiRecipientPage({
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

  const { data: recipient } = await supabase
    .from("coi_recipients")
    .select("id, name, email, address, requirements, recurring")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!recipient) notFound();

  return (
    <PageShell width="narrow">
      <Breadcrumb
        items={[
          { label: "COI", href: "/coi" },
          { label: recipient.name, href: `/coi/recipients/${recipient.id}` },
          { label: "Edit" },
        ]}
      />

      <PageHeader
        code="Update contact details and coverage requirements"
        title="Edit recipient"
        size="compact"
      />

      <EditCoiRecipientForm
        initial={{
          id: recipient.id,
          name: recipient.name ?? "",
          email: recipient.email ?? "",
          address: recipient.address ?? "",
          requirements: recipient.requirements ?? "",
          recurring: Boolean(recipient.recurring),
        }}
      />
    </PageShell>
  );
}
