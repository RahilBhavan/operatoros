"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Utility, Caption } from "@/components/doctrine";

const NAV_ITEMS = [
  { href: "/dashboard", label: "DASHBOARD", code: "A" },
  { href: "/deadlines", label: "DEADLINES", code: "B" },
  { href: "/billing", label: "BILLING", code: "C" },
  { href: "/settings/team", label: "TEAM", code: "D" },
];

export default function AppNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <nav className="bg-[var(--color-field)] border-b-2 border-[var(--color-ground)]">
      <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-8 flex-wrap">
          <Link href="/dashboard" className="flex items-baseline gap-3">
            <span className="t-h3 font-black tracking-tight leading-none">
              OPERATOR<span className="text-[var(--color-mark)]">OS</span>
            </span>
          </Link>
          <div className="flex items-center gap-1 flex-wrap">
            {NAV_ITEMS.map(({ href, label, code }) => {
              const active = pathname === href || pathname?.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-stretch border-2 ${
                    active
                      ? "border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)]"
                      : "border-transparent text-[var(--color-ground)] hover:border-[var(--color-ground)]"
                  }`}
                >
                  <span className="px-3 py-1.5 border-r-2 border-current opacity-70 t-utility !text-[12px]">
                    {code}
                  </span>
                  <span className="px-3 py-1.5 t-utility">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Caption className="hidden sm:block !opacity-70 !text-[12px]">
            {userEmail}
          </Caption>
          <button
            onClick={handleSignOut}
            className="t-utility hover:text-[var(--color-mark)]"
          >
            SIGN OUT →
          </button>
        </div>
      </div>
    </nav>
  );
}
