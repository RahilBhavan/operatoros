import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

export const PLANS = {
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    amount: 29,
    features: [
      "Up to 25 deadlines",
      "Email reminders",
      "Document storage (1 GB)",
      "Basic dashboard",
    ],
  },
  growth: {
    name: "Growth",
    priceId: process.env.STRIPE_GROWTH_PRICE_ID!,
    amount: 79,
    features: [
      "Unlimited deadlines",
      "Email + SMS reminders",
      "Document storage (10 GB)",
      "Shareable compliance link",
      "PDF audit export",
      "Priority support",
    ],
  },
  scale: {
    name: "Scale",
    priceId: process.env.STRIPE_SCALE_PRICE_ID!,
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
} as const;

export type PlanTier = keyof typeof PLANS;
