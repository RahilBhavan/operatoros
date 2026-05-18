import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { track, identify, isAnalyticsConfigured } from "@/lib/analytics";

describe("analytics — no-op stub", () => {
  beforeEach(() => {
    delete process.env.POSTHOG_API_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  });

  it("returns sent:false when no key is set", async () => {
    expect(isAnalyticsConfigured()).toBe(false);
    const result = await track({
      distinctId: "user-1",
      event: "signup_completed",
    });
    expect(result).toEqual({ sent: false });
  });

  it("identify is a no-op without a key", async () => {
    const result = await identify("user-1", { plan_tier: "free" });
    expect(result).toEqual({ sent: false });
  });
});

describe("analytics — with key", () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    process.env.POSTHOG_API_KEY = "phc_test";
  });

  afterEach(() => {
    global.fetch = realFetch;
    delete process.env.POSTHOG_API_KEY;
  });

  it("posts a payload to the capture endpoint", async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      calls.push({ url, body: JSON.parse(init?.body as string) });
      return new Response(JSON.stringify({ status: 1 }), { status: 200 });
    }) as unknown as typeof fetch;

    const result = await track({
      distinctId: "user-1",
      event: "signup_completed",
      properties: { plan_tier: "free", state: "CA" },
    });

    expect(result.sent).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("/capture/");
    const body = calls[0].body as Record<string, unknown>;
    expect(body.api_key).toBe("phc_test");
    expect(body.event).toBe("signup_completed");
    expect(body.distinct_id).toBe("user-1");
  });

  it("strips PII-shaped property keys", async () => {
    const calls: Array<{ body: unknown }> = [];
    global.fetch = vi.fn(async (_input, init?: RequestInit) => {
      calls.push({ body: JSON.parse(init?.body as string) });
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    await track({
      distinctId: "user-1",
      event: "signup_completed",
      properties: {
        // these should be stripped
        email: "leak@example.com",
        full_name: "Alice",
        owner_email_address: "owner@example.com",
        phone_number: "+1234567890",
        // these should remain
        plan_tier: "free",
        state: "CA",
        days_until_due: 7,
      },
    });

    const props = (calls[0].body as { properties: Record<string, unknown> })
      .properties;
    expect(props).toEqual({
      plan_tier: "free",
      state: "CA",
      days_until_due: 7,
    });
  });

  it("returns sent:false when fetch throws", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    const result = await track({
      distinctId: "user-1",
      event: "signup_completed",
    });
    expect(result.sent).toBe(false);
  });
});
