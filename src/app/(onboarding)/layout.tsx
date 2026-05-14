import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
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

  if (business?.onboarding_complete) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
