import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditCoiRecipientForm from "@/components/coi/EditCoiRecipientForm";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";

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
    <div className="max-w-[680px] flex flex-col gap-5">
      <Breadcrumb
        items={[
          { label: "COI", href: "/coi" },
          { label: recipient.name, href: `/coi/recipients/${recipient.id}` },
          { label: "Edit" },
        ]}
      />
      <header className="border-b-4 border-[var(--color-ground)] pb-3">
        <div className="t-utility mb-2">PA-COI · EDIT · {id.slice(0, 6).toUpperCase()}</div>
        <h1
          style={{
            fontFamily: "var(--font-destination)",
            fontWeight: 900,
            fontSize: "clamp(28px, 4vw, 40px)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          Edit recipient
        </h1>
      </header>

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
    </div>
  );
}
