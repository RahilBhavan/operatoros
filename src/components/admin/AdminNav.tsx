"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Index, Utility, Caption } from "@/components/doctrine";

const ITEMS = [
  { href: "/admin", label: "OVERVIEW", code: "A", exact: true },
  { href: "/admin/businesses", label: "BUSINESSES", code: "B" },
  { href: "/admin/waitlist", label: "WAITLIST", code: "C" },
  { href: "/admin/rules", label: "RULES", code: "D" },
  { href: "/admin/audit", label: "AUDIT", code: "E" },
  { href: "/admin/invites", label: "INVITES", code: "F" },
];

export default function AdminNav({
  email,
  displayName,
}: {
  email: string;
  displayName: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <nav className="bg-[var(--color-ground)] text-[var(--color-field)] border-b-[6px] border-[var(--color-mark)]">
      <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-6 flex-wrap">
          <Link href="/admin" className="flex items-baseline gap-3">
            <span className="t-h3 font-black tracking-tight leading-none">
              OPERATOR<span className="text-[var(--color-mark)]">OS</span>
            </span>
            <Index className="!text-[var(--color-mark)] !text-[15px]">
              PA-ADMIN
            </Index>
            <Utility className="!text-[var(--color-field)] opacity-80 hidden sm:inline">
              CONTROL TOWER · OPS
            </Utility>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <Caption className="!text-[var(--color-field)] !opacity-80 !text-[12px]">
              {displayName ?? email}
            </Caption>
            {displayName && (
              <Caption className="!text-[var(--color-field)] !opacity-50 !text-[12px]">
                {email}
              </Caption>
            )}
          </div>
          <Link
            href="/dashboard"
            className="t-utility text-[var(--color-field)] opacity-80 hover:opacity-100 hover:text-[var(--color-mark)]"
          >
            ← EXIT
          </Link>
          <button
            onClick={handleSignOut}
            className="t-utility text-[var(--color-field)] opacity-80 hover:opacity-100 hover:text-[var(--color-mark)]"
          >
            SIGN OUT →
          </button>
        </div>
      </div>

      {/* Sort-styled nav tabs row */}
      <div className="max-w-[1200px] mx-auto px-6 pb-4 flex items-center gap-1 flex-wrap">
        {ITEMS.map(({ href, label, code, exact }) => {
          const active = exact ? pathname === href : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-stretch border-2 ${
                active
                  ? "border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)]"
                  : "border-[var(--color-field)] text-[var(--color-field)] hover:border-[var(--color-mark)] hover:text-[var(--color-mark)]"
              }`}
            >
              <span className="px-3 py-1.5 border-r-2 border-current opacity-80 t-utility !text-[12px]">
                {code}
              </span>
              <span className="px-3 py-1.5 t-utility">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
