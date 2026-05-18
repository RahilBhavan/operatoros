import { describe, it, expect } from "vitest";
import {
  entitlementsFor,
  planTier,
  isPaidWithFullFeatures,
  shouldSuggestLite,
} from "@/lib/entitlements";

describe("entitlements", () => {
  it("narrows unknown plan strings to free", () => {
    expect(planTier(null)).toBe("free");
    expect(planTier(undefined)).toBe("free");
    expect(planTier("")).toBe("free");
    expect(planTier("enterprise")).toBe("free");
  });

  it("preserves valid plan tiers verbatim", () => {
    expect(planTier("lite")).toBe("lite");
    expect(planTier("business")).toBe("business");
    expect(planTier("accountant")).toBe("accountant");
  });

  it("returns the right entitlements matrix per tier", () => {
    const free = entitlementsFor("free");
    expect(free.ai).toBe(false);
    expect(free.shareLink).toBe(false);
    expect(free.storageCapMib).toBe(100);

    const lite = entitlementsFor("lite");
    expect(lite.ai).toBe(false);
    expect(lite.storageCapMib).toBe(1024);

    const biz = entitlementsFor("business");
    expect(biz.ai).toBe(true);
    expect(biz.accountantPortal).toBe(true);
    expect(biz.teamInvites).toBe(true);

    const acct = entitlementsFor("accountant");
    expect(acct.ai).toBe(true);
    expect(acct.storageCapMib).toBeGreaterThan(biz.storageCapMib);
  });

  it("isPaidWithFullFeatures only true when billing active+ai+shareLink", () => {
    expect(isPaidWithFullFeatures("business", "active")).toBe(true);
    expect(isPaidWithFullFeatures("business", "trialing")).toBe(true);
    expect(isPaidWithFullFeatures("business", "past_due")).toBe(false);
    expect(isPaidWithFullFeatures("lite", "active")).toBe(false);
    expect(isPaidWithFullFeatures("free", "active")).toBe(false);
  });

  it("shouldSuggestLite respects industry + employee threshold", () => {
    expect(shouldSuggestLite("retail", 1)).toBe(true);
    expect(shouldSuggestLite("personal_services", 3)).toBe(true);
    expect(shouldSuggestLite("retail", 4)).toBe(false);
    expect(shouldSuggestLite("healthcare", 1)).toBe(false);
    expect(shouldSuggestLite(null, 1)).toBe(false);
    expect(shouldSuggestLite("retail", null)).toBe(false);
  });
});
