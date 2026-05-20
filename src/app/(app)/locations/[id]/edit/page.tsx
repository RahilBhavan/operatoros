import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditLocationForm from "@/components/locations/EditLocationForm";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageShell } from "@/components/doctrine/PageShell";

export const dynamic = "force-dynamic";

export default async function EditLocationPage({
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

  const { data: location } = await supabase
    .from("locations")
    .select("id, name, state, city, address, zip, county, open_date")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!location) notFound();

  const displayName =
    location.name ?? `${location.city ?? "Primary"} location`;

  return (
    <PageShell width="narrow">
      <Breadcrumb
        items={[
          { label: "Locations", href: "/locations" },
          { label: displayName, href: `/locations/${location.id}` },
          { label: "Edit" },
        ]}
      />
      <PageHeader
        title="Edit location"
        description={`Update details for ${displayName}.`}
        size="compact"
      />
      <EditLocationForm
        initial={{
          id: location.id,
          name: location.name ?? "",
          state: location.state ?? "",
          city: location.city ?? "",
          address: location.address ?? "",
          zip: location.zip ?? "",
          county: location.county ?? "",
          open_date: location.open_date ?? "",
        }}
      />
    </PageShell>
  );
}
