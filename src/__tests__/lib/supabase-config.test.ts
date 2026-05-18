import { afterEach, describe, expect, it } from "vitest";
import {
  getSupabaseAdminConfig,
  getSupabasePublicConfig,
  isSupabasePublicConfigured,
} from "@/lib/supabase/config";

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

describe("getSupabasePublicConfig", () => {
  const saved: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("returns url and anon key when set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    expect(getSupabasePublicConfig()).toEqual({
      url: "https://abc.supabase.co",
      anonKey: "anon-key",
    });
    expect(isSupabasePublicConfigured()).toBe(true);
  });

  it("throws a clear error when public vars are missing", () => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }

    expect(() => getSupabasePublicConfig()).toThrow(/Supabase is not configured/);
    expect(isSupabasePublicConfigured()).toBe(false);
  });

  it("throws when service role key is missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => getSupabaseAdminConfig()).toThrow(/service role key/i);
  });
});
