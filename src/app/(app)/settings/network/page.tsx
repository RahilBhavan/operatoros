import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CreateLinkForm,
  RevokeLinkButton,
  CopyLinkButton,
} from "@/components/settings/NetworkInviteControls";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageShell } from "@/components/doctrine/PageShell";
import { settings } from "@/lib/ui-copy";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://operatoros.app";

export const metadata = {
  title: "Network · OperatorOS",
};

export default async function NetworkSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, plan_tier")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) redirect("/onboarding");

  if (business.plan_tier !== "accountant") {
    return (
      <PageShell width="narrow">
        <Breadcrumb
          items={[
            { label: "Settings", href: "/settings" },
            { label: "Network growth" },
          ]}
        />
        <PageHeader title={settings.network.title} size="compact" />
        <div className="border-2 border-[var(--color-ground)] p-8">
          <p
            className="text-[14px] leading-relaxed"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Tracked invite links are an Accountant plan feature. Switch to the
            Accountant plan from{" "}
            <a href="/billing" className="underline">
              billing
            </a>{" "}
            to invite clients and track MRR you bring in.
          </p>
        </div>
      </PageShell>
    );
  }

  const { data: links } = await supabase
    .from("accountant_invite_links")
    .select(
      "id, code, label, signups_count, paid_conversions_count, created_at, revoked_at"
    )
    .eq("accountant_id", user.id)
    .order("created_at", { ascending: false });

  const active = (links ?? []).filter((l) => !l.revoked_at);
  const revoked = (links ?? []).filter((l) => Boolean(l.revoked_at));

  const totals = active.reduce(
    (acc, l) => ({
      signups: acc.signups + (l.signups_count ?? 0),
      conversions: acc.conversions + (l.paid_conversions_count ?? 0),
    }),
    { signups: 0, conversions: 0 }
  );

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Network growth" },
        ]}
      />
      <PageHeader
        title={settings.network.title}
        description={settings.network.description}
      />

      <section className="grid grid-cols-2 gap-3">
        <Stat label="Total signups" value={totals.signups} />
        <Stat label="Paid conversions" value={totals.conversions} />
      </section>

      <section>
        <h2
          className="text-[18px] font-bold uppercase tracking-wider mb-3"
          style={{ fontFamily: "var(--font-index)" }}
        >
          New link
        </h2>
        <CreateLinkForm appUrl={APP_URL} />
      </section>

      <section>
        <h2
          className="text-[18px] font-bold uppercase tracking-wider mb-3"
          style={{ fontFamily: "var(--font-index)" }}
        >
          Active links{active.length ? ` · ${active.length}` : ""}
        </h2>
        {active.length === 0 ? (
          <div
            className="border-2 border-[var(--color-ground)] p-6 text-[13px] text-[var(--color-ground)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            No active links yet. Create one above and share it with your clients.
          </div>
        ) : (
          <ul className="border-2 border-[var(--color-ground)]">
            {active.map((link, i) => (
              <li
                key={link.id}
                className={
                  "p-4 flex flex-wrap items-center justify-between gap-3 " +
                  (i === active.length - 1
                    ? ""
                    : "border-b border-[var(--color-ground)]")
                }
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div
                    className="text-[13px] font-bold"
                    style={{ fontFamily: "var(--font-index)" }}
                  >
                    {link.label ?? "Untitled link"}
                  </div>
                  <code className="text-[12px] break-all text-[var(--color-ground)]">
                    {`${APP_URL.replace(/\/$/, "")}/i/${link.code}`}
                  </code>
                </div>
                <div
                  className="flex items-center gap-4 text-[12px] uppercase tracking-wider flex-wrap"
                  style={{ fontFamily: "var(--font-utility)" }}
                >
                  <span className="tabular-nums">{link.signups_count ?? 0} signups</span>
                  <span className="tabular-nums">{link.paid_conversions_count ?? 0} paid</span>
                  <CopyLinkButton
                    url={`${APP_URL.replace(/\/$/, "")}/i/${link.code}`}
                  />
                  <RevokeLinkButton linkId={link.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {revoked.length > 0 ? (
        <section>
          <h2
            className="t-utility mb-3"
            style={{ fontFamily: "var(--font-index)" }}
          >
            Revoked · {revoked.length}
          </h2>
          <ul className="border-2 border-[var(--color-ground)]">
            {revoked.map((link, i) => (
              <li
                key={link.id}
                className={
                  "p-3 flex flex-wrap items-center justify-between gap-3 " +
                  (i === revoked.length - 1
                    ? ""
                    : "border-b border-[var(--color-ground)]")
                }
              >
                <code className="text-[12px] break-all line-through">
                  {`/i/${link.code}`}
                </code>
                <span
                  className="text-[11px] uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-utility)" }}
                >
                  {link.signups_count ?? 0} signups ·{" "}
                  {link.paid_conversions_count ?? 0} paid
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-2 border-[var(--color-ground)] p-4">
      <div
        className="text-[11px] uppercase tracking-wider"
        style={{ fontFamily: "var(--font-utility)" }}
      >
        {label}
      </div>
      <div
        className="mt-1 text-[32px] font-bold"
        style={{ fontFamily: "var(--font-destination)" }}
      >
        {value}
      </div>
    </div>
  );
}
