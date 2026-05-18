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

const PRICE_ENV_BY_TIER: Record<PaidPlanTier, string> = {
  lite: "STRIPE_LITE_PRICE_ID",
  business: "STRIPE_BUSINESS_PRICE_ID",
  accountant: "STRIPE_ACCOUNTANT_PRICE_ID",
};

export function getPriceId(tier: PaidPlanTier): string {
  const key = PRICE_ENV_BY_TIER[tier];
  const id = process.env[key];
  if (!id) throw new Error(`${key} is not set`);
  return id;
}

export const PLANS = {
  lite: {
    name: "Lite",
    amount: 39,
    description: "For thin-compliance solo operators — calendar + email only",
    features: [
      "Unlimited deadlines",
      "Document storage (1 GB)",
      "Email reminders",
      "Federal + state taxonomy",
      "No AI insights, accountant portal, or share link",
    ],
  },
  business: {
    name: "Business",
    amount: 79,
    description: "For small businesses tracking their own compliance",
    features: [
      "Unlimited deadlines",
      "Document storage (10 GB)",
      "Email + SMS reminders",
      "AI compliance insights",
      "Shareable audit link",
      "PDF audit export",
      "Invite your accountant (read-only)",
      "Up to 5 team members",
    ],
  },
  accountant: {
    name: "Accountant",
    amount: 299,
    description: "For CPAs and bookkeepers managing client portfolios",
    features: [
      "Manage up to 200 client portfolios",
      "Bulk client onboarding",
      "White-labeled compliance reports",
      "Per-client compliance score dashboard",
      "Accountant action portal (notes, flags)",
      "Priority API access",
      "Dedicated account manager",
    ],
  },
} as const;

export type PaidPlanTier = keyof typeof PLANS;
export type PlanTier = "free" | PaidPlanTier;


export function stripeCustomerIdToString(
  customer: string | { id?: string } | null | undefined
): string | null {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  if (typeof customer === "object" && customer.id) return customer.id;
  return null;
}

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
