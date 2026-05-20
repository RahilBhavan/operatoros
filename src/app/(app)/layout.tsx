import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/dashboard/AppNav";
import InstallPrompt from "@/components/pwa/InstallPrompt";

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
    <div className="min-h-screen bg-[var(--color-field)] text-[var(--color-ground)] flex flex-col">
      <a href="#main-content" className="sr-only">
        Skip to main content
      </a>
      <AppNav userEmail={user.email ?? ""} />
      <main
        id="main-content"
        className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-4 sm:py-6"
      >
        {children}
      </main>
      <InstallPrompt />
    </div>
  );
}
