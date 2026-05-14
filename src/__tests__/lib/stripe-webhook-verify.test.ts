import { describe, expect, it } from "vitest";
import {
  resolveSubscriptionBusinessId,
  resolveTrustedBusinessId,
  stripeCustomerIdToString,
} from "@/lib/stripe";

describe("stripeCustomerIdToString", () => {
  it("returns string id as-is", () => {
    expect(stripeCustomerIdToString("cus_123")).toBe("cus_123");
  });

  it("extracts id from expanded customer object", () => {
    expect(stripeCustomerIdToString({ id: "cus_abc" })).toBe("cus_abc");
  });

  it("returns null for empty", () => {
    expect(stripeCustomerIdToString(null)).toBeNull();
    expect(stripeCustomerIdToString(undefined)).toBeNull();
  });
});

describe("resolveTrustedBusinessId", () => {
  it("returns id when customer row matches metadata", () => {
    expect(
      resolveTrustedBusinessId({
        stripeCustomerId: "cus_x",
        businessFromCustomer: { id: "biz-uuid" },
        metadataBusinessId: "biz-uuid",
      })
    ).toBe("biz-uuid");
  });

  it("returns null when metadata business_id does not match DB row", () => {
    expect(
      resolveTrustedBusinessId({
        stripeCustomerId: "cus_x",
        businessFromCustomer: { id: "correct" },
        metadataBusinessId: "attacker-other",
      })
    ).toBeNull();
  });

  it("returns null when no business row for customer", () => {
    expect(
      resolveTrustedBusinessId({
        stripeCustomerId: "cus_x",
        businessFromCustomer: null,
        metadataBusinessId: "biz-uuid",
      })
    ).toBeNull();
  });

  it("returns null when metadata missing", () => {
    expect(
      resolveTrustedBusinessId({
        stripeCustomerId: "cus_x",
        businessFromCustomer: { id: "biz-uuid" },
        metadataBusinessId: null,
      })
    ).toBeNull();
  });
});

describe("resolveSubscriptionBusinessId", () => {
  it("returns business id when metadata absent (customer-bound)", () => {
    expect(
      resolveSubscriptionBusinessId({
        stripeCustomerId: "cus_x",
        businessFromCustomer: { id: "biz-1" },
        metadataBusinessId: null,
      })
    ).toBe("biz-1");
  });

  it("requires metadata match when metadata present", () => {
    expect(
      resolveSubscriptionBusinessId({
        stripeCustomerId: "cus_x",
        businessFromCustomer: { id: "biz-1" },
        metadataBusinessId: "biz-1",
      })
    ).toBe("biz-1");
    expect(
      resolveSubscriptionBusinessId({
        stripeCustomerId: "cus_x",
        businessFromCustomer: { id: "biz-1" },
        metadataBusinessId: "other",
      })
    ).toBeNull();
  });
});

