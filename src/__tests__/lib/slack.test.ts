import { describe, expect, it, vi } from "vitest";

import { isSlackWebhookUrl } from "@/lib/slack";

describe("isSlackWebhookUrl", () => {
  it("accepts a canonical Slack incoming-webhook URL", () => {
    expect(
      isSlackWebhookUrl(
        "https://hooks.slack.com/services/T01ABCDEFGH/B01ABCDEFGH/abcdefgh1234567890abcdefgh"
      )
    ).toBe(true);
  });

  it("rejects http (must be https)", () => {
    expect(
      isSlackWebhookUrl(
        "http://hooks.slack.com/services/T01/B01/abc"
      )
    ).toBe(false);
  });

  it("rejects look-alike hosts", () => {
    expect(
      isSlackWebhookUrl("https://hooks.slack.com.evil.example/services/A/B/c")
    ).toBe(false);
    expect(
      isSlackWebhookUrl("https://hooks-slack.com/services/A/B/c")
    ).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isSlackWebhookUrl(null)).toBe(false);
    expect(isSlackWebhookUrl(undefined)).toBe(false);
    expect(isSlackWebhookUrl(42)).toBe(false);
    expect(isSlackWebhookUrl({})).toBe(false);
  });

  it("rejects empty or partial paths", () => {
    expect(isSlackWebhookUrl("https://hooks.slack.com/services/")).toBe(false);
    expect(isSlackWebhookUrl("https://hooks.slack.com/")).toBe(false);
  });
});

describe("sendSlack — payload shape (smoke test via fetch mock)", () => {
  it("POSTs JSON with text + optional blocks to the provided webhook URL", async () => {
    // Mock the Supabase admin client + fetch BEFORE importing sendSlack so
    // the imported singleton sees the mocks.
    vi.resetModules();

    const insertChain = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "log-1" }, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    };
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({ from: () => insertChain }),
    }));

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }));

    const { sendSlack } = await import("@/lib/slack");
    const result = await sendSlack({
      webhookUrl:
        "https://hooks.slack.com/services/T01ABCDEFGH/B01ABCDEFGH/abcdefgh1234567890abcdefgh",
      text: "OperatorOS: IRS Form 941 due in 7 days",
      kind: "reminder",
      userId: "u1",
      businessId: "b1",
    });

    expect(result.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toMatch(/^https:\/\/hooks\.slack\.com\/services\//);
    expect((init as RequestInit).method).toBe("POST");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.text).toContain("IRS Form 941");
    expect(body.blocks).toBeUndefined();

    fetchSpy.mockRestore();
  });

  it("refuses to send to a non-Slack URL even if the migration's CHECK didn't catch it", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({ from: () => ({}) }),
    }));
    const { sendSlack } = await import("@/lib/slack");
    const result = await sendSlack({
      webhookUrl: "https://evil.example/services/A/B/c",
      text: "x",
      kind: "reminder",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Invalid Slack webhook URL");
  });
});
