import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listInvoicesForCustomer, formatInvoiceAmount } from "@/lib/billing/invoices";
import { Body, Caption } from "@/components/doctrine";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageSection } from "@/components/doctrine/PageSection";
import { PageShell } from "@/components/doctrine/PageShell";
import { PageEmptyState } from "@/components/doctrine/PageEmptyState";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, stripe_customer_id, billing_status")
    .eq("owner_id", user.id)
    .single();
  if (!business) redirect("/onboarding");

  const invoices = business.stripe_customer_id
    ? await listInvoicesForCustomer(business.stripe_customer_id)
    : [];

  return (
    <PageShell width="narrow">
      <Breadcrumb
        items={[{ label: "Billing", href: "/billing" }, { label: "Invoices" }]}
      />
      <PageHeader
        title="Invoices"
        description="Every charge Stripe billed your account, with the PDF + hosted receipt. Sourced live from Stripe."
      />

      {!business.stripe_customer_id ? (
        <PageEmptyState
          title="No invoices yet"
          description="You haven't started a paid subscription. Start a free trial from the billing page to see invoices here."
          actions={
            <a href="/billing" className="t-utility hover:text-[var(--color-mark)]">
              Go to billing →
            </a>
          }
        />
      ) : invoices.length === 0 ? (
        <PageEmptyState
          title="No invoices yet"
          description="Your trial is active. Your first invoice will appear here when Stripe charges the card on file after the trial ends."
          actions={
            <a href="/billing" className="t-utility hover:text-[var(--color-mark)]">
              Back to billing →
            </a>
          }
        />
      ) : (
        <PageSection title="Invoices" count={invoices.length}>
          <div className="bg-[var(--color-field)] divide-y-2 divide-[var(--color-ground)]/15">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="px-4 py-3 flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="flex flex-col min-w-0">
                  <Body className="!font-bold !text-[15px]">
                    {inv.number ?? inv.id}
                  </Body>
                  <Caption className="!text-[12px]">
                    {new Date(inv.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {inv.periodStart && inv.periodEnd ? (
                      <span>
                        {" · "}
                        {new Date(inv.periodStart).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        {" – "}
                        {new Date(inv.periodEnd).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    ) : null}
                  </Caption>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <Body className="!font-bold !text-[15px] tabular-nums">
                      {formatInvoiceAmount(inv.amountPaidCents || inv.amountDueCents, inv.currency)}
                    </Body>
                    <StatusPill status={inv.status} />
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {inv.hostedInvoiceUrl ? (
                      <a
                        href={inv.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="t-utility hover:text-[var(--color-mark)] !text-[11px]"
                      >
                        VIEW →
                      </a>
                    ) : null}
                    {inv.invoicePdf ? (
                      <a
                        href={inv.invoicePdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="t-utility hover:text-[var(--color-mark)] !text-[11px]"
                      >
                        PDF →
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PageSection>
      )}
    </PageShell>
  );
}

function StatusPill({ status }: { status: string | null }) {
  if (!status) return null;
  const paid = status === "paid";
  const open = status === "open";
  const failed = status === "uncollectible" || status === "void";
  const color = paid
    ? "var(--color-ground)"
    : failed
      ? "var(--color-mark)"
      : "var(--color-ground)";
  const bg = paid ? "transparent" : failed ? "var(--color-mark)" : "transparent";
  const text = failed ? "var(--color-field)" : color;
  return (
    <span
      className="inline-block border-2 px-2 py-0.5 t-utility !text-[10px] mt-1"
      style={{ borderColor: color, background: bg, color: text }}
    >
      {open ? "OPEN" : status.toUpperCase()}
    </span>
  );
}
