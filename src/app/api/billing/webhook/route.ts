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

      break;
    }

    case "customer.subscription.trial_will_end": {
      // TODO: dispatch trial-ending email via @/lib/email helper. Owned by a
      // separate agent — do not add the send here.
      const sub = event.data.object as Stripe.Subscription;
      console.info("[stripe] trial_will_end", {
        event_id: event.id,
        subscription_id: sub.id,
        trial_end: sub.trial_end,
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
