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
