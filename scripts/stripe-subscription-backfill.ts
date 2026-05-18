/**
 * WS-F — One-time backfill from Stripe into public.stripe_subscriptions.
 *
 * Usage:
 *   npx tsx scripts/stripe-subscription-backfill.ts
 *
 * Requires STRIPE_SECRET_KEY + NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * in the environment. Idempotent — re-runs are safe because the underlying
 * insert is an upsert on the Stripe subscription id.
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeKey || !supabaseUrl || !serviceRole) {
    console.error(
      "Missing env: STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
    );
    process.exit(1);
  }

  const stripe = new Stripe(stripeKey);
  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const knownPriceMap = new Map<string, "business" | "accountant" | "lite">();
  const businessPriceId = process.env.STRIPE_BUSINESS_PRICE_ID;
  const accountantPriceId = process.env.STRIPE_ACCOUNTANT_PRO_PRICE_ID;
  const litePriceId = process.env.STRIPE_LITE_PRICE_ID;
  if (businessPriceId) knownPriceMap.set(businessPriceId, "business");
  if (accountantPriceId) knownPriceMap.set(accountantPriceId, "accountant");
  if (litePriceId) knownPriceMap.set(litePriceId, "lite");

  let processed = 0;
  let skipped = 0;
  let errored = 0;

  for await (const sub of stripe.subscriptions.list({
    status: "all",
    limit: 100,
    expand: ["data.items"],
  })) {
    const item = sub.items.data[0];
    if (!item) {
      skipped++;
      continue;
    }
    const priceId = item.price?.id ?? null;
    if (!priceId) {
      skipped++;
      continue;
    }
    const planTier = knownPriceMap.get(priceId);
    if (!planTier) {
      console.warn(
        `[backfill] sub=${sub.id} price=${priceId} did not match any known tier — skipping`
      );
      skipped++;
      continue;
    }

    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? "";

    // Resolve business by stripe_customer_id; safe if missing (the column is
    // nullable so historical rows can land regardless).
    let businessId: string | null = null;
    if (customerId) {
      const { data } = await supabase
        .from("businesses")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      businessId = data?.id ?? null;
    }

    const { error } = await supabase.from("stripe_subscriptions").upsert(
      {
        id: sub.id,
        business_id: businessId,
        customer_id: customerId,
        status: sub.status,
        price_id: priceId,
        plan_tier: planTier,
        current_period_start: new Date(
          item.current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
          item.current_period_end * 1000
        ).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        canceled_at: sub.canceled_at
          ? new Date(sub.canceled_at * 1000).toISOString()
          : null,
        trial_end: sub.trial_end
          ? new Date(sub.trial_end * 1000).toISOString()
          : null,
        unit_amount_cents: item.price?.unit_amount ?? 0,
        currency: item.price?.currency ?? "usd",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error(`[backfill] sub=${sub.id} upsert failed: ${error.message}`);
      errored++;
    } else {
      processed++;
    }
  }

  console.log(
    `[backfill] done — processed=${processed} skipped=${skipped} errored=${errored}`
  );
}

void main().catch((err) => {
  console.error("[backfill] fatal", err);
  process.exit(1);
});
