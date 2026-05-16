import { requirePlatformAdmin } from "@/lib/security/platform-admin";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, admin } = await requirePlatformAdmin();
  return (
    <div className="min-h-screen bg-[var(--color-field)] text-[var(--color-ground)]">
      <AdminNav email={user.email} displayName={admin.display_name} />
      <main className="max-w-[1200px] mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
