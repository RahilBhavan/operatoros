import { afterEach, describe, expect, it } from "vitest";
import { getAppUrl } from "@/lib/app-url";

describe("getAppUrl", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("prefers NEXT_PUBLIC_APP_URL", () => {
    process.env = {
      ...env,
      NEXT_PUBLIC_APP_URL: "https://app.example.com/",
      VERCEL_URL: "preview.vercel.app",
    };
    expect(getAppUrl()).toBe("https://app.example.com");
  });

  it("falls back to VERCEL_URL", () => {
    process.env = {
      ...env,
      NEXT_PUBLIC_APP_URL: undefined,
      VERCEL_URL: "my-preview.vercel.app",
    };
    expect(getAppUrl()).toBe("https://my-preview.vercel.app");
  });

  it("defaults to localhost in dev", () => {
    process.env = {
      ...env,
      NEXT_PUBLIC_APP_URL: undefined,
      VERCEL_URL: undefined,
    };
    expect(getAppUrl()).toBe("http://localhost:3000");
  });
});
