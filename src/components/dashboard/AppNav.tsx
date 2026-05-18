"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/doctrine/Wordmark";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/deadlines", label: "Deadlines" },
  { href: "/billing", label: "Billing" },
  { href: "/settings/team", label: "Team" },
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
    <nav
      aria-label="App navigation"
      className="w-full bg-[var(--color-field)] border-t-4 border-b-2 border-t-[var(--color-ground)] border-b-[var(--color-ground)]"
    >
      <div className="max-w-[1160px] mx-auto flex items-center gap-6 px-6 h-16">
        <Wordmark href="/dashboard" size={18} />

        <div className="flex items-stretch self-stretch ml-4 -mb-[2px]">
          {NAV_ITEMS.map(({ href, label }) => {
            const active =
              pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`px-4 flex items-center t-utility no-underline text-[var(--color-ground)] border-b-4 ${
                  active ? "border-[var(--color-mark)]" : "border-transparent"
                } hover:text-[var(--color-mark)] transition-colors`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <span
            className="hidden sm:inline text-[13px]"
            style={{ fontFamily: "var(--font-index)" }}
          >
            {userEmail}
          </span>
          <button
            onClick={handleSignOut}
            className="t-utility text-[var(--color-ground)] hover:text-[var(--color-mark)] transition-colors no-underline"
          >
            Sign out →
          </button>
        </div>
      </div>
    </nav>
  );
}
