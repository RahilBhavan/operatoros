import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditLocationForm from "@/components/locations/EditLocationForm";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";

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
    <div className="max-w-[680px] flex flex-col gap-5">
      <Breadcrumb
        items={[
          { label: "Locations", href: "/locations" },
          { label: displayName, href: `/locations/${location.id}` },
          { label: "Edit" },
        ]}
      />
      <header className="border-b-4 border-[var(--color-ground)] pb-3">
        <div className="t-utility mb-2">PA-LOC · EDIT · {id.slice(0, 6).toUpperCase()}</div>
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
          Edit location
        </h1>
      </header>

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
    </div>
  );
}
