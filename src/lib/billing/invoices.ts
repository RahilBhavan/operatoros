// Server-side helper: list a customer's invoices from Stripe with the fields
// the in-app invoices view needs. Server-only — never expose Stripe keys to
// the client. Used by /billing (recent invoices section) and /billing/invoices
// (full list).

import { getStripe } from "@/lib/stripe";

export interface InvoiceSummary {
  id: string;
  number: string | null;
  createdAt: string; // ISO
  amountDueCents: number;
  amountPaidCents: number;
  currency: string;
  status: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  periodStart: string | null;
  periodEnd: string | null;
}

export async function listInvoicesForCustomer(
  stripeCustomerId: string,
  limit: number = 12
): Promise<InvoiceSummary[]> {
  if (!stripeCustomerId) return [];
  try {
    const page = await getStripe().invoices.list({
      customer: stripeCustomerId,
      limit: Math.min(Math.max(limit, 1), 100),
    });
    return page.data.map((inv) => ({
      id: inv.id ?? "",
      number: inv.number ?? null,
      createdAt: new Date((inv.created ?? 0) * 1000).toISOString(),
      amountDueCents: inv.amount_due ?? 0,
      amountPaidCents: inv.amount_paid ?? 0,
      currency: inv.currency ?? "usd",
      status: inv.status ?? null,
      hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
      invoicePdf: inv.invoice_pdf ?? null,
      periodStart: inv.period_start
        ? new Date(inv.period_start * 1000).toISOString()
        : null,
      periodEnd: inv.period_end
        ? new Date(inv.period_end * 1000).toISOString()
        : null,
    }));
  } catch (err) {
    // Don't crash the page if Stripe is misconfigured — surface a typed
    // empty list and let the page render an explanatory empty state.
    console.error("[billing/invoices] list failed", {
      customer: stripeCustomerId,
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

export function formatInvoiceAmount(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}
