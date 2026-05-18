import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getPriceId, PLANS, type PaidPlanTier } from "@/lib/stripe";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { BILLING_CHECKOUT_LIMIT } from "@/lib/security/rate-limits";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Bound Stripe customer creation per user — without this a script could
  // spam this endpoint and burn Stripe API quota (and pollute Stripe data
  // until the customer_id is set on the businesses row).
  const allowed = await consumeRateLimit(
    `billing:checkout:${user.id}`,
    BILLING_CHECKOUT_LIMIT.max,
    BILLING_CHECKOUT_LIMIT.windowSeconds
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Try again in an hour." },
      { status: 429 }
    );
  }

  const { plan } = await req.json();

  if (!plan || !(plan in PLANS)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, stripe_customer_id, plan_tier")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  let customerId = business.stripe_customer_id;

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { business_id: business.id, user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from("businesses")
      .update({ stripe_customer_id: customerId })
      .eq("id", business.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: getPriceId(plan as PaidPlanTier), quantity: 1 }],
    success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/billing`,
    subscription_data: {
      metadata: { business_id: business.id, plan },
      trial_period_days: 14,
    },
    metadata: { business_id: business.id, plan },
  });

  return NextResponse.json({ url: session.url });
}
