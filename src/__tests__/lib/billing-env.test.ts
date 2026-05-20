import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { validateStripeConfig } from "@/lib/billing/env";

const KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_BUSINESS_PRICE_ID",
  "STRIPE_ACCOUNTANT_PRICE_ID",
  "STRIPE_LITE_PRICE_ID",
] as const;

describe("validateStripeConfig", () => {
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("reports missing when nothing is set", () => {
    const r = validateStripeConfig();
    expect(r.mode).toBe("missing");
    expect(r.ready).toBe(false);
    expect(r.issues.length).toBeGreaterThan(0);
  });

  it("detects test mode from sk_test_ prefix", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_abc";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_abc";
    process.env.STRIPE_BUSINESS_PRICE_ID = "price_b";
    process.env.STRIPE_ACCOUNTANT_PRICE_ID = "price_a";
    const r = validateStripeConfig();
    expect(r.mode).toBe("test");
    expect(r.ready).toBe(true);
    expect(r.issues).toEqual([]);
  });

  it("detects live mode from sk_live_ prefix", () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_abc";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_abc";
    process.env.STRIPE_BUSINESS_PRICE_ID = "price_b";
    process.env.STRIPE_ACCOUNTANT_PRICE_ID = "price_a";
    const r = validateStripeConfig();
    expect(r.mode).toBe("live");
    expect(r.ready).toBe(true);
  });

  it("flags an invalid webhook secret prefix", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_abc";
    process.env.STRIPE_WEBHOOK_SECRET = "sk_test_abc";
    process.env.STRIPE_BUSINESS_PRICE_ID = "price_b";
    process.env.STRIPE_ACCOUNTANT_PRICE_ID = "price_a";
    const r = validateStripeConfig();
    expect(r.issues.some((i) => i.includes("whsec_"))).toBe(true);
  });

  it("does not require lite (lite checkout isn't shipped yet)", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_abc";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_abc";
    process.env.STRIPE_BUSINESS_PRICE_ID = "price_b";
    process.env.STRIPE_ACCOUNTANT_PRICE_ID = "price_a";
    // lite intentionally unset
    const r = validateStripeConfig();
    expect(r.ready).toBe(true);
    expect(r.priceIds.lite).toBeNull();
  });

  it("reports not-ready if only one price ID is set", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_abc";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_abc";
    process.env.STRIPE_BUSINESS_PRICE_ID = "price_b";
    const r = validateStripeConfig();
    expect(r.ready).toBe(false);
    expect(r.issues.some((i) => i.includes("ACCOUNTANT_PRICE_ID"))).toBe(true);
  });
});
