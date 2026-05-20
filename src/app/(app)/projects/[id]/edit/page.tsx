import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditProjectForm from "@/components/projects/EditProjectForm";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageShell } from "@/components/doctrine/PageShell";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
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

  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, name, address, jurisdiction_code, customer_name, gc_business_name, start_date, end_date, value_cents",
    )
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!project) notFound();

  return (
    <PageShell width="narrow">
      <Breadcrumb
        items={[
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${project.id}` },
          { label: "Edit" },
        ]}
      />
      <PageHeader
        title="Edit project"
        description={`Update details for ${project.name}.`}
        size="compact"
      />
      <EditProjectForm
        initial={{
          id: project.id,
          name: project.name ?? "",
          address: project.address ?? "",
          jurisdiction_code: project.jurisdiction_code ?? "",
          customer_name: project.customer_name ?? "",
          gc_business_name: project.gc_business_name ?? "",
          start_date: project.start_date ?? "",
          end_date: project.end_date ?? "",
          value:
            typeof project.value_cents === "number"
              ? (project.value_cents / 100).toString()
              : "",
        }}
      />
    </PageShell>
  );
}
