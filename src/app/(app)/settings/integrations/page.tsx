import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PROVIDERS, isProviderConfigured } from "@/lib/integrations/providers";
import { LinkButton } from "@/components/doctrine/Button";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageShell } from "@/components/doctrine/PageShell";
import { settings } from "@/lib/ui-copy";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!business) redirect("/onboarding");

  const { data: connections } = await supabase
    .from("integration_connections")
    .select("provider, status, last_synced_at, last_sync_error_at, last_sync_error")
    .eq("business_id", business.id);

  const byProvider = new Map<string, NonNullable<typeof connections>[number]>();
  for (const c of connections ?? []) byProvider.set(c.provider, c);

  const list = Object.values(PROVIDERS);

  const PROVIDER_MARK: Record<string, string> = {
    simplepractice: "SP",
    karbon: "K",
    qbo: "QB",
    taxdome: "TD",
  };

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Integrations" },
        ]}
      />
      <PageHeader
        title={settings.integrations.title}
        description={settings.integrations.description}
      />

      <section className="border-2 border-[var(--color-ground)]">
        <ul className="bg-[var(--color-field)]">
          {list.map((p, i) => {
            const configured = isProviderConfigured(p);
            const connection = byProvider.get(p.id);
            const connected =
              connection != null && connection.status === "active";
            return (
              <li
                key={p.id}
                className={
                  i === list.length - 1
                    ? "p-5"
                    : "p-5 border-b border-[var(--color-ground)]"
                }
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4 min-w-0">
                    <span
                      aria-hidden
                      className="shrink-0 inline-flex items-center justify-center w-12 h-12 border-2 border-[var(--color-ground)] text-[var(--color-ground)] tabular-nums t-page-title text-[18px] tracking-wide"
                    >
                      {PROVIDER_MARK[p.id] ?? p.id.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-[16px]">
                        {p.label}
                      </div>
                      <div className="t-utility mt-1">{p.workstream}</div>
                      <p className="mt-2 text-[14px] max-w-[520px]">
                        {p.description}
                      </p>
                      {connection?.last_synced_at ? (
                        <div className="t-utility mt-2">
                          Last synced:{" "}
                          {new Date(connection.last_synced_at).toLocaleString()}
                        </div>
                      ) : null}
                      {connection?.last_sync_error ? (
                        <div className="t-utility mt-1 text-[var(--color-mark)]">
                          Sync error: {connection.last_sync_error}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {!configured ? (
                      <span className="t-utility text-[var(--color-ground)]">
                        Admin must configure
                      </span>
                    ) : connected ? (
                      <LinkButton
                        href={`/api/integrations/${p.id}/disconnect`}
                        variant="ghost"
                      >
                        Disconnect
                      </LinkButton>
                    ) : (
                      <LinkButton
                        href={`/api/integrations/${p.id}/start`}
                        variant="mark"
                      >
                        Connect →
                      </LinkButton>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div>
        <LinkButton href="/settings" variant="ghost">
          ← Back to settings
        </LinkButton>
      </div>
    </PageShell>
  );
}
