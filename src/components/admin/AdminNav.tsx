"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/doctrine/Wordmark";

const ITEMS = [
  { href: "/admin", label: "Overview", code: "A", exact: true },
  { href: "/admin/businesses", label: "Businesses", code: "B" },
  { href: "/admin/waitlist", label: "Waitlist", code: "C" },
  { href: "/admin/rules", label: "Rules", code: "D" },
  { href: "/admin/corrections", label: "Corrections", code: "E" },
  { href: "/admin/audit", label: "Audit", code: "F" },
  { href: "/admin/invites", label: "Invites", code: "G" },
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
    <nav
      aria-label="Admin navigation"
      className="w-full bg-[var(--color-field)] border-t-4 border-b border-t-[var(--color-ground)] border-b-[var(--color-ground)]"
    >
      <div className="max-w-[1200px] mx-auto px-6 pt-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-baseline gap-4 flex-wrap">
          <Wordmark href="/admin" size={20} />
          <span
            className="t-utility text-[var(--color-mark)]"
            style={{ fontSize: 12 }}
          >
            PA-ADMIN
          </span>
          <span
            className="hidden sm:inline t-utility text-[var(--color-ground)]"
            style={{ fontSize: 12 }}
          >
            Control tower · OPS
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end leading-tight">
            <span
              className="text-[12px] text-[var(--color-ground)]"
              style={{ fontFamily: "var(--font-index)" }}
            >
              {displayName ?? email}
            </span>
            {displayName && (
              <span
                className="text-[12px] text-[var(--color-ground)]"
                style={{ fontFamily: "var(--font-index)" }}
              >
                {email}
              </span>
            )}
          </div>
          <Link
            href="/dashboard"
            className="t-utility text-[var(--color-ground)] hover:text-[var(--color-mark)] transition-colors no-underline"
          >
            ← Exit
          </Link>
          <button
            onClick={handleSignOut}
            className="t-utility text-[var(--color-ground)] hover:text-[var(--color-mark)] transition-colors no-underline"
          >
            Sign out →
          </button>
        </div>
      </div>

      {/* Tabs row — active tab gets a Mark underline, mirroring AppNav. */}
      <div className="max-w-[1200px] mx-auto px-6 flex items-stretch gap-1 flex-wrap -mb-px">
        {ITEMS.map(({ href, label, code, exact }) => {
          const active = exact ? pathname === href : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`px-3 py-3 flex items-center gap-2 t-utility no-underline text-[var(--color-ground)] border-b-4 ${
                active ? "border-[var(--color-mark)]" : "border-transparent"
              } hover:text-[var(--color-mark)] transition-colors`}
            >
              <span
                className="text-[var(--color-mark)]"
                style={{ fontSize: 11 }}
              >
                {code}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
