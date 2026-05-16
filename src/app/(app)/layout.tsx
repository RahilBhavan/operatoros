import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/dashboard/AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, onboarding_complete")
    .eq("owner_id", user.id)
    .single();

  if (!business?.onboarding_complete) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-[var(--color-field)]">
      <AppNav userEmail={user.email ?? ""} />
      <main className="max-w-[1100px] mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
