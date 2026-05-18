import { NextRequest, NextResponse } from "next/server";
import {
  getPriceId,
  getStripe,
  resolveSubscriptionBusinessId,
  resolveTrustedBusinessId,
  stripeCustomerIdToString,
  type PaidPlanTier,
} from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type BillingStatus =
  Database["public"]["Tables"]["businesses"]["Update"]["billing_status"];
type PlanTier =
  Database["public"]["Tables"]["businesses"]["Update"]["plan_tier"];

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

const PAID_TIERS: PaidPlanTier[] = ["business", "accountant"];

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  // Stripe 2026 API moved subscription off Invoice — now lives under
  // parent.subscription_details.subscription (string or expanded object).
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return null;
  if (typeof sub === "string") return sub;
  return sub.id ?? null;
}

function tierFromPriceId(priceId: string | null | undefined): PaidPlanTier | null {
  if (!priceId) return null;
  for (const tier of PAID_TIERS) {
    try {
      if (getPriceId(tier) === priceId) return tier;
    } catch {
      // Env var for this tier not configured — skip.
    }
  }
  return null;
}

/**
 * WS-F — mirror a Stripe.Subscription into stripe_subscriptions. Called from
 * subscription.{created,updated,deleted} handlers. Idempotent (upsert).
 *
 * 2026 Stripe API: current_period_start/end moved off Subscription onto
 * SubscriptionItem, so we read them from items.data[0].
 */
async function mirrorStripeSubscription(
  supabase: SupabaseAdmin,
  sub: Stripe.Subscription,
  businessId: string | null
): Promise<void> {
  const item = sub.items.data[0];
  if (!item) return;

  const priceId = item.price?.id ?? null;
  if (!priceId) return;

  const planTier = tierFromPriceId(priceId);
  if (!planTier) {
    // Unknown price — don't mirror (would violate CHECK on plan_tier).
    console.warn("[stripe] mirror skipped: unknown price", {
      subscription_id: sub.id,
      price_id: priceId,
    });
    return;
  }

  const unitAmountCents = item.price?.unit_amount ?? 0;
  const currency = item.price?.currency ?? "usd";

  const row: Database["public"]["Tables"]["stripe_subscriptions"]["Insert"] = {
    id: sub.id,
    business_id: businessId,
    customer_id: stripeCustomerIdToString(sub.customer) ?? "",
    status: sub.status,
    price_id: priceId,
    plan_tier: planTier as "business" | "accountant",
    current_period_start: new Date(item.current_period_start * 1000).toISOString(),
    current_period_end: new Date(item.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    canceled_at: sub.canceled_at
      ? new Date(sub.canceled_at * 1000).toISOString()
      : null,
    trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    unit_amount_cents: unitAmountCents,
    currency,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("stripe_subscriptions")
    .upsert(row, { onConflict: "id" });
  if (error) {
    console.warn("[stripe] mirror upsert failed", {
      subscription_id: sub.id,
      error: error.message,
    });
  }
}

function logAuditEvent(
  supabase: SupabaseAdmin,
  args: {
    businessId: string | null;
    action: string;
    eventId: string;
    eventType: string;
    targetId?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  // Fire-and-forget: never fail the webhook on audit insert failure.
  supabase
    .from("audit_events")
    .insert({
      business_id: args.businessId,
      actor_user_id: null,
      event_type: args.action,
      target_id: args.targetId ?? null,
      metadata: {
        event_id: args.eventId,
        type: args.eventType,
        ...(args.metadata ?? {}),
      },
    })
    .then(({ error }) => {
      if (error) {
        console.warn("[stripe] audit insert failed", {
          action: args.action,
          event_id: args.eventId,
          error: error.message,
        });
      }
    });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Idempotency: insert event id; if duplicate, short-circuit. This guards
  // every handler below (including unhandled types) against Stripe retries.
  const { data: insertedEvent, error: idempotencyError } = await supabase
    .from("stripe_received_events")
    .insert({ event_id: event.id, event_type: event.type })
    .select("event_id")
    .maybeSingle();

  if (idempotencyError) {
    // Postgres unique_violation → already processed. Any other error is a
    // legitimate failure (DB down, etc.) — let Stripe retry.
    if (idempotencyError.code === "23505") {
      return NextResponse.json({ idempotent: true });
    }
    console.error("[stripe] idempotency insert failed", {
      event_id: event.id,
      code: idempotencyError.code,
      message: idempotencyError.message,
    });
    return NextResponse.json({ error: "idempotency_failed" }, { status: 500 });
  }

  if (!insertedEvent) {
    // ON CONFLICT DO NOTHING returned no row → duplicate.
    return NextResponse.json({ idempotent: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const metadataBusinessId = session.metadata?.business_id ?? null;
      const plan = session.metadata?.plan;
      if (!plan) break;

      const customerId = stripeCustomerIdToString(session.customer);
      if (!customerId) break;

      const { data: businessRow } = await supabase
        .from("businesses")
        .select("id, billing_status, plan_tier")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      const trustedId = resolveTrustedBusinessId({
        stripeCustomerId: customerId,
        businessFromCustomer: businessRow,
        metadataBusinessId,
      });
      if (!trustedId) break;

      const subscription = await getStripe().subscriptions.retrieve(
        session.subscription as string
      );

      await supabase
        .from("businesses")
        .update({
          stripe_subscription_id: subscription.id,
          plan_tier: plan as PlanTier,
          billing_status: subscription.status as BillingStatus,
          trial_ends_at: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
        })
        .eq("id", trustedId);

      // WS-F — mirror the subscription into stripe_subscriptions for MRR truth.
      await mirrorStripeSubscription(supabase, subscription, trustedId);

      logAuditEvent(supabase, {
        businessId: trustedId,
        action: "billing.subscription_created",
        eventId: event.id,
        eventType: event.type,
        targetId: trustedId,
        metadata: {
          prior_status: businessRow?.billing_status ?? null,
          new_status: subscription.status,
          plan_tier: plan,
          subscription_id: subscription.id,
        },
      });

      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = stripeCustomerIdToString(sub.customer);
      if (!customerId) break;

      const { data: businessRow } = await supabase
        .from("businesses")
        .select("id, billing_status, plan_tier")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      const trustedId = resolveSubscriptionBusinessId({
        stripeCustomerId: customerId,
        businessFromCustomer: businessRow,
        metadataBusinessId: sub.metadata?.business_id ?? null,
      });
      if (!trustedId) break;

      // Price id is source of truth. Trust metadata only as confirmation.
      const priceId = sub.items.data[0]?.price?.id ?? null;
      const tierFromPrice = tierFromPriceId(priceId);

      const metadataPlan = sub.metadata?.plan as PaidPlanTier | undefined;

      const update: Database["public"]["Tables"]["businesses"]["Update"] = {
        billing_status: sub.status as BillingStatus,
      };

      if (!tierFromPrice) {
        console.warn(
          "[stripe] subscription.updated: price_id did not match any known tier",
          {
            event_id: event.id,
            subscription_id: sub.id,
            price_id: priceId,
          }
        );
        // Do not mutate plan_tier — still safe to update billing_status and
        // trial_end since those don't depend on tier identity.
      } else {
        if (metadataPlan && metadataPlan !== tierFromPrice) {
          console.warn("[stripe] subscription.updated: metadata.plan mismatch", {
            event_id: event.id,
            subscription_id: sub.id,
            metadata_plan: metadataPlan,
            price_tier: tierFromPrice,
          });
        }
        update.plan_tier = tierFromPrice as PlanTier;
      }

      if (sub.trial_end) {
        update.trial_ends_at = new Date(sub.trial_end * 1000).toISOString();
      }

      await supabase.from("businesses").update(update).eq("id", trustedId);

      // WS-F — keep the mirror current on every subscription change.
      await mirrorStripeSubscription(supabase, sub, trustedId);

      logAuditEvent(supabase, {
        businessId: trustedId,
        action: "billing.subscription_updated",
        eventId: event.id,
        eventType: event.type,
        targetId: trustedId,
        metadata: {
          prior_status: businessRow?.billing_status ?? null,
          new_status: sub.status,
          prior_plan_tier: businessRow?.plan_tier ?? null,
          new_plan_tier: update.plan_tier ?? businessRow?.plan_tier ?? null,
          price_id: priceId,
          subscription_id: sub.id,
        },
      });

      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = stripeCustomerIdToString(sub.customer);
      if (!customerId) break;

      const { data: businessRow } = await supabase
        .from("businesses")
        .select("id, billing_status, plan_tier")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      const trustedId = resolveSubscriptionBusinessId({
        stripeCustomerId: customerId,
        businessFromCustomer: businessRow,
        metadataBusinessId: sub.metadata?.business_id ?? null,
      });
      if (!trustedId) break;

      await supabase
        .from("businesses")
        .update({
          billing_status: "canceled" as BillingStatus,
          plan_tier: "free" as PlanTier,
          stripe_subscription_id: null,
        })
        .eq("id", trustedId);

      // WS-F — capture final state of the sub before it disappears from
      // Stripe so MRR sums + churn analytics retain the row.
      await mirrorStripeSubscription(supabase, sub, trustedId);

      logAuditEvent(supabase, {
        businessId: trustedId,
        action: "billing.subscription_deleted",
        eventId: event.id,
        eventType: event.type,
        targetId: trustedId,
        metadata: {
          prior_status: businessRow?.billing_status ?? null,
          new_status: "canceled",
          prior_plan_tier: businessRow?.plan_tier ?? null,
          new_plan_tier: "free",
          subscription_id: sub.id,
        },
      });

      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = stripeCustomerIdToString(
        invoice.customer as string | { id?: string } | null
      );
      if (!customerId) break;

      const { data: businessRow } = await supabase
        .from("businesses")
        .select("id, billing_status")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (!businessRow?.id) {
        console.warn("[stripe] invoice.payment_failed: no business for customer", {
          event_id: event.id,
          customer_id: customerId,
        });
        break;
      }

      // Cross-check via subscription metadata. Fetch the subscription if we
      // have its id; verify metadata.business_id matches our row.
      const subscriptionId = invoiceSubscriptionId(invoice);

      if (!subscriptionId) {
        console.warn(
          "[stripe] invoice.payment_failed: no subscription on invoice, skipping",
          { event_id: event.id, customer_id: customerId }
        );
        break;
      }

      const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
      const metadataBusinessId = subscription.metadata?.business_id ?? null;
      const trustedId = resolveSubscriptionBusinessId({
        stripeCustomerId: customerId,
        businessFromCustomer: businessRow,
        metadataBusinessId,
      });

      if (!trustedId) {
        console.warn(
          "[stripe] invoice.payment_failed: metadata.business_id mismatch, refusing to flip past_due",
          {
            event_id: event.id,
            customer_id: customerId,
            metadata_business_id: metadataBusinessId,
            db_business_id: businessRow.id,
          }
        );
        break;
      }

      await supabase
        .from("businesses")
        .update({ billing_status: "past_due" })
        .eq("id", trustedId);

      logAuditEvent(supabase, {
        businessId: trustedId,
        action: "billing.payment_failed",
        eventId: event.id,
        eventType: event.type,
        targetId: trustedId,
        metadata: {
          prior_status: businessRow.billing_status ?? null,
          new_status: "past_due",
          subscription_id: subscriptionId,
          invoice_id: invoice.id,
        },
      });

      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const reason = invoice.billing_reason;
      if (
        reason !== "subscription_cycle" &&
        reason !== "subscription_create" &&
        reason !== "subscription_update"
      ) {
        // Not a subscription billing event we care about.
        break;
      }

      const customerId = stripeCustomerIdToString(
        invoice.customer as string | { id?: string } | null
      );
      if (!customerId) break;

      const { data: businessRow } = await supabase
        .from("businesses")
        .select("id, billing_status")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (!businessRow?.id) {
        console.warn(
          "[stripe] invoice.payment_succeeded: no business for customer",
          { event_id: event.id, customer_id: customerId }
        );
        break;
      }

      const subscriptionId = invoiceSubscriptionId(invoice);

      if (!subscriptionId) {
        console.warn(
          "[stripe] invoice.payment_succeeded: no subscription on invoice, skipping",
          { event_id: event.id, customer_id: customerId }
        );
        break;
      }

      const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
      const metadataBusinessId = subscription.metadata?.business_id ?? null;
      const trustedId = resolveSubscriptionBusinessId({
        stripeCustomerId: customerId,
        businessFromCustomer: businessRow,
        metadataBusinessId,
      });

      if (!trustedId) {
        console.warn(
          "[stripe] invoice.payment_succeeded: metadata.business_id mismatch, refusing to set active",
          {
            event_id: event.id,
            customer_id: customerId,
            metadata_business_id: metadataBusinessId,
            db_business_id: businessRow.id,
          }
        );
        break;
      }

      await supabase
        .from("businesses")
        .update({ billing_status: "active" as BillingStatus })
        .eq("id", trustedId);

      logAuditEvent(supabase, {
        businessId: trustedId,
        action: "billing.payment_recovered",
        eventId: event.id,
        eventType: event.type,
        targetId: trustedId,
        metadata: {
          prior_status: businessRow.billing_status ?? null,
          new_status: "active",
          billing_reason: reason,
          subscription_id: subscriptionId,
          invoice_id: invoice.id,
        },
      });

      // WS-D — viral attribution. First paid invoice for a viral-attributed
      // business increments the accountant's paid_conversions_count. Only
      // subscription_create qualifies as "first" (cycle/update are renewals).
      // The webhook-level idempotency guard above (stripe_received_events)
      // prevents double-counting on Stripe retries.
      if (reason === "subscription_create") {
        const tierFromPrice = tierFromPriceId(
          subscription.items.data[0]?.price?.id ?? null
        );

        // WS-E — first paid invoice is the canonical upgrade_completed event.
        const { track } = await import("@/lib/analytics");
        void track({
          distinctId: trustedId,
          event: "upgrade_completed",
          properties: {
            business_id: trustedId,
            tier: tierFromPrice ?? "unknown",
            amount_cents: invoice.amount_paid ?? 0,
            currency: invoice.currency ?? "usd",
          },
          groups: { business: trustedId },
        });

        const { data: attribution } = await supabase
          .from("businesses")
          .select("invite_code")
          .eq("id", trustedId)
          .maybeSingle();
        const inviteCode = attribution?.invite_code ?? null;
        if (inviteCode) {
          const { data: link } = await supabase
            .from("accountant_invite_links")
            .select("id, accountant_id")
            .eq("code", inviteCode)
            .maybeSingle();
          if (link?.id) {
            const { incrementInviteLinkCounter } = await import(
              "@/lib/viral-attribution"
            );
            const result = await incrementInviteLinkCounter(
              supabase,
              link.id,
              "paid_conversions_count"
            );
            if (!result.ok) {
              console.warn("[stripe] viral conversion increment failed", {
                event_id: event.id,
                link_id: link.id,
                error: result.error,
              });
            } else {
              void track({
                distinctId: link.accountant_id,
                event: "invite_link_conversion",
                properties: {
                  business_id: trustedId,
                  invite_code: inviteCode,
                  tier: tierFromPrice ?? "unknown",
                },
              });
            }
          }
        }
      }

      break;
    }

    case "customer.subscription.trial_will_end": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = stripeCustomerIdToString(sub.customer);
      if (!customerId || !sub.trial_end) break;

      const { data: businessRow } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      const trustedId = resolveSubscriptionBusinessId({
        stripeCustomerId: customerId,
        businessFromCustomer: businessRow,
        metadataBusinessId: sub.metadata?.business_id ?? null,
      });
      if (!trustedId) break;

      let customerEmail: string | null = null;
      try {
        const customer = await getStripe().customers.retrieve(customerId);
        if (customer && !("deleted" in customer && customer.deleted)) {
          customerEmail = (customer as Stripe.Customer).email ?? null;
        }
      } catch (err) {
        console.warn("[stripe] trial_will_end: failed to fetch customer email", {
          event_id: event.id,
          customer_id: customerId,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      const trialEndIso = new Date(sub.trial_end * 1000).toISOString();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const billingUrl = appUrl ? `${appUrl.replace(/\/$/, "")}/billing` : "";

      if (customerEmail && billingUrl) {
        try {
          const { sendTrialEndingEmail } = await import("@/lib/email");
          await sendTrialEndingEmail({
            to: customerEmail,
            businessName: businessRow?.name ?? null,
            trialEndIso,
            billingUrl,
          });
        } catch (err) {
          console.warn("[stripe] trial_will_end: email send failed", {
            event_id: event.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      logAuditEvent(supabase, {
        businessId: trustedId,
        action: "billing.trial_will_end",
        eventId: event.id,
        eventType: event.type,
        targetId: trustedId,
        metadata: {
          subscription_id: sub.id,
          trial_end: trialEndIso,
          email_sent: Boolean(customerEmail),
        },
      });

      break;
    }

    default: {
      console.warn("[stripe] unhandled event", {
        type: event.type,
        id: event.id,
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
