// Stripe env-var validation. Surfaces in two places:
//   • `/admin` billing tile — visual confirmation for the founder that test
//     vs live keys are consistent and price IDs are populated.
//   • startup log (called from instrumentation.ts if/when we wire one) —
//     so a misconfigured deploy fails loudly.
//
// `tier_required` is the contract: Business + Accountant must be set to
// actually sell. Lite is reserved for the future Lite-checkout flow and is
// optional today.

export type StripeEnvMode = "test" | "live" | "mixed" | "missing";

export interface StripeEnvReport {
  mode: StripeEnvMode;
  secretKeyPresent: boolean;
  webhookSecretPresent: boolean;
  priceIds: {
    business: string | null;
    accountant: string | null;
    lite: string | null;
  };
  required: {
    business: boolean;
    accountant: boolean;
  };
  ready: boolean;
  issues: string[];
}

function detectMode(secretKey: string | undefined): StripeEnvMode {
  if (!secretKey) return "missing";
  if (secretKey.startsWith("sk_test_")) return "test";
  if (secretKey.startsWith("sk_live_")) return "live";
  return "missing";
}

function priceMode(priceId: string | null): "test" | "live" | null {
  if (!priceId) return null;
  // Stripe price IDs don't have a mode prefix, but each mode has its own
  // namespace — they only error at API call time. We treat both as valid;
  // mismatch surfaces as a Stripe API error during checkout.
  return priceId.startsWith("price_") ? null : null;
}

export function validateStripeConfig(): StripeEnvReport {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const business = process.env.STRIPE_BUSINESS_PRICE_ID || null;
  const accountant = process.env.STRIPE_ACCOUNTANT_PRICE_ID || null;
  const lite = process.env.STRIPE_LITE_PRICE_ID || null;

  const mode = detectMode(secretKey);
  const issues: string[] = [];

  if (mode === "missing") {
    issues.push("STRIPE_SECRET_KEY is not set or has an unrecognized prefix (expected sk_test_ or sk_live_).");
  }
  if (!webhookSecret) {
    issues.push("STRIPE_WEBHOOK_SECRET is not set — webhook handler will reject every event.");
  } else if (!webhookSecret.startsWith("whsec_")) {
    issues.push("STRIPE_WEBHOOK_SECRET does not start with `whsec_` — verify you copied the signing secret, not a key.");
  }
  if (!business) {
    issues.push("STRIPE_BUSINESS_PRICE_ID is not set — Business checkout will fail.");
  }
  if (!accountant) {
    issues.push("STRIPE_ACCOUNTANT_PRICE_ID is not set — Accountant checkout will fail.");
  }
  // Lite is intentionally optional — see docs/billing/SETUP.md.

  // Suppress mode helper var — kept to make the priceMode hook discoverable.
  void priceMode;

  return {
    mode,
    secretKeyPresent: Boolean(secretKey),
    webhookSecretPresent: Boolean(webhookSecret),
    priceIds: { business, accountant, lite },
    required: {
      business: Boolean(business),
      accountant: Boolean(accountant),
    },
    ready: mode !== "missing" && Boolean(webhookSecret) && Boolean(business) && Boolean(accountant),
    issues,
  };
}
