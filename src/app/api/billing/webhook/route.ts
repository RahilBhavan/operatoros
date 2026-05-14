import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type BillingStatus =
  Database["public"]["Tables"]["businesses"]["Update"]["billing_status"];
type PlanTier =
  Database["public"]["Tables"]["businesses"]["Update"]["plan_tier"];

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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const businessId = session.metadata?.business_id;
      const plan = session.metadata?.plan;
      if (!businessId || !plan) break;

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
        .eq("id", businessId);

      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const businessId = sub.metadata?.business_id;
      if (!businessId) break;

      const plan = sub.metadata?.plan as PlanTier | undefined;

      const update: Database["public"]["Tables"]["businesses"]["Update"] = {
        billing_status: sub.status as BillingStatus,
      };

      if (plan) update.plan_tier = plan;
      if (sub.trial_end) {
        update.trial_ends_at = new Date(sub.trial_end * 1000).toISOString();
      }

      await supabase.from("businesses").update(update).eq("id", businessId);

      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const businessId = sub.metadata?.business_id;
      if (!businessId) break;

      await supabase
        .from("businesses")
        .update({
          billing_status: "canceled",
          plan_tier: "free",
          stripe_subscription_id: null,
        })
        .eq("id", businessId);

      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await supabase
        .from("businesses")
        .update({ billing_status: "past_due" })
        .eq("stripe_customer_id", customerId);

      break;
    }
  }

  return NextResponse.json({ received: true });
}
