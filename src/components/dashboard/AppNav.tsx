"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/doctrine/Wordmark";

type NavItem = { href: string; label: string; title?: string };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/deadlines", label: "Deadlines" },
    ],
  },
  {
    label: "Track",
    items: [
      { href: "/staff", label: "Staff" },
      { href: "/projects", label: "Projects" },
      { href: "/coi", label: "COI", title: "Certificates of insurance" },
      { href: "/audit-prep", label: "Audit" },
      { href: "/locations", label: "Locations" },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/settings", label: "Settings" }],
  },
];

function isActive(pathname: string | null, href: string) {
  return pathname === href || Boolean(pathname?.startsWith(href + "/"));
}

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
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 h-14 border-b border-[var(--color-ground)]/15">
          <Wordmark href="/dashboard" size={18} />
          <span className="hidden sm:inline t-utility text-[var(--color-ground)]/70 ml-1">
            Compliance workspace
          </span>
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <span className="hidden lg:inline t-caption truncate max-w-[200px]">
              {userEmail}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="t-utility text-[var(--color-ground)] hover:text-[var(--color-mark)] transition-colors"
            >
              Sign out →
            </button>
          </div>
        </div>

        <div className="flex items-stretch -mb-[2px] overflow-x-auto no-scrollbar gap-1 py-0">
          {NAV_GROUPS.map((group, gi) => (
            <div
              key={group.label}
              className="flex items-stretch shrink-0"
              aria-label={group.label}
            >
              {gi > 0 ? (
                <span
                  className="w-px self-stretch bg-[var(--color-ground)]/20 mx-1 sm:mx-2 shrink-0"
                  aria-hidden
                />
              ) : null}
              {group.items.map(({ href, label, title }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={title}
                    aria-current={active ? "page" : undefined}
                    className={`px-3 sm:px-3.5 flex items-center t-utility whitespace-nowrap no-underline text-[var(--color-ground)] border-b-4 min-h-[44px] ${
                      active
                        ? "border-[var(--color-mark)] text-[var(--color-mark)]"
                        : "border-transparent hover:text-[var(--color-mark)]"
                    } transition-colors`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
