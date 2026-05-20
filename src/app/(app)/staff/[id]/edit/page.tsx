import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditStaffForm from "@/components/staff/EditStaffForm";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageShell } from "@/components/doctrine/PageShell";

export const dynamic = "force-dynamic";

export default async function EditStaffPage({
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

  const { data: staff } = await supabase
    .from("staff_members")
    .select("id, full_name, email, role, employment_type, hire_date")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!staff) notFound();

  return (
    <PageShell width="narrow">
      <Breadcrumb
        items={[
          { label: "Staff", href: "/staff" },
          { label: staff.full_name, href: `/staff/${staff.id}` },
          { label: "Edit" },
        ]}
      />
      <PageHeader
        title="Edit staff member"
        description={`Update details for ${staff.full_name}.`}
        size="compact"
      />
      <EditStaffForm
        initial={{
          id: staff.id,
          full_name: staff.full_name ?? "",
          email: staff.email ?? "",
          role: staff.role ?? "",
          employment_type: staff.employment_type ?? "w2",
          hire_date: staff.hire_date ?? "",
        }}
      />
    </PageShell>
  );
}
