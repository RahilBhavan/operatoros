import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditStaffForm from "@/components/staff/EditStaffForm";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";

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
    <div className="max-w-[680px] flex flex-col gap-5">
      <Breadcrumb
        items={[
          { label: "Staff", href: "/staff" },
          { label: staff.full_name, href: `/staff/${staff.id}` },
          { label: "Edit" },
        ]}
      />
      <header className="border-b-4 border-[var(--color-ground)] pb-3">
        <div className="t-utility mb-2">PA-STAF · EDIT · {id.slice(0, 6).toUpperCase()}</div>
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
          Edit staff member
        </h1>
      </header>

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
    </div>
  );
}
