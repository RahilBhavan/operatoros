import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

export function getPriceId(tier: PlanTier): string {
  const key =
    tier === "starter"
      ? "STRIPE_STARTER_PRICE_ID"
      : tier === "growth"
        ? "STRIPE_GROWTH_PRICE_ID"
        : "STRIPE_SCALE_PRICE_ID";
  const id = process.env[key];
  if (!id) throw new Error(`${key} is not set`);
  return id;
}

export const PLANS = {
  starter: {
    name: "Starter",
    amount: 29,
    features: [
      "Up to 50 deadlines",
      "Email reminders",
      "Document storage (1 GB)",
      "Basic dashboard",
    ],
  },
  growth: {
    name: "Growth",
    amount: 79,
    features: [
      "Unlimited deadlines",
      "Email + SMS reminders",
      "Document storage (10 GB)",
      "Shareable compliance link",
      "PDF audit export",
      "AI compliance insights",
      "Priority support",
    ],
  },
  scale: {
    name: "Scale",
    amount: 149,
    features: [
      "Everything in Growth",
      "Multiple locations",
      "Team members (5 seats)",
      "API access",
      "Custom reminders",
      "Dedicated support",
    ],
  },
  accountant_pro: {
    name: "Accountant Pro",
    amount: 499,
    features: [
      "Manage up to 200 client portfolios",
      "White-labeled compliance reports",
      "Bulk client onboarding",
      "Accountant action portal (add notes, flag items)",
      "Priority API access",
      "Dedicated account manager",
      "Volume discount pricing for clients",
    ],
  },
} as const;

export type PlanTier = keyof typeof PLANS;


/**
 * Stripe webhook helpers: never trust `metadata.business_id` unless it matches
 * the row keyed by `stripe_customer_id` from the Stripe object.
 */
export function stripeCustomerIdToString(
  customer: string | { id?: string } | null | undefined
): string | null {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  if (typeof customer === "object" && customer.id) return customer.id;
  return null;
}

/** Business id to mutate, or null when metadata must not be applied. */
export function resolveTrustedBusinessId(args: {
  stripeCustomerId: string | null;
  businessFromCustomer: { id: string } | null | undefined;
  metadataBusinessId: string | null | undefined;
}): string | null {
  if (!args.stripeCustomerId) return null;
  const row = args.businessFromCustomer;
  if (!row?.id) return null;
  if (!args.metadataBusinessId || args.metadataBusinessId !== row.id) {
    return null;
  }
  return row.id;
}

/** Subscription lifecycle events: prefer metadata match when present; otherwise trust customer→business row. */
export function resolveSubscriptionBusinessId(args: {
  stripeCustomerId: string | null;
  businessFromCustomer: { id: string } | null | undefined;
  metadataBusinessId: string | null | undefined;
}): string | null {
  if (!args.stripeCustomerId || !args.businessFromCustomer?.id) return null;
  if (!args.metadataBusinessId) return args.businessFromCustomer.id;
  return args.metadataBusinessId === args.businessFromCustomer.id
    ? args.businessFromCustomer.id
    : null;
}

