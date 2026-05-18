import { describe, it, expect, afterEach } from "vitest";
import { isSmsConfigured, sendSms } from "@/lib/sms";

describe("isSmsConfigured", () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it("requires sid, token, and from-number", () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_FROM_NUMBER;
    expect(isSmsConfigured()).toBe(false);

    process.env.TWILIO_ACCOUNT_SID = "AC_test";
    expect(isSmsConfigured()).toBe(false);

    process.env.TWILIO_AUTH_TOKEN = "tok_test";
    expect(isSmsConfigured()).toBe(false);

    process.env.TWILIO_FROM_NUMBER = "+15551234567";
    expect(isSmsConfigured()).toBe(true);
  });
});

describe("sendSms (unconfigured)", () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it("returns ok=false without making a network call when twilio env is missing", async () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_FROM_NUMBER;
    const result = await sendSms({
      toPhone: "+15551234567",
      body: "test",
      kind: "system",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not configured/i);
  });
});
