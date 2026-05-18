import { z } from "zod";

/** Server-only secrets and integration keys validated at startup. */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_LITE_PRICE_ID: z.string().min(1).optional(),
  STRIPE_BUSINESS_PRICE_ID: z.string().min(1).optional(),
  STRIPE_ACCOUNTANT_PRICE_ID: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
});

/** Public vars exposed to the browser bundle. */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

let cached: { server: ServerEnv; public: PublicEnv } | null = null;

/**
 * Validates required environment variables. Call from instrumentation during
 * production builds so misconfigured Vercel env fails deploy, not runtime 500s.
 */
export function validateEnv(): { server: ServerEnv; public: PublicEnv } {
  if (cached) return cached;

  const publicResult = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || undefined,
  });

  if (!publicResult.success) {
    const missing = publicResult.error.issues
      .map((i) => i.path.join("."))
      .join(", ");
    throw new Error(
      `Missing or invalid public environment variables: ${missing}. See .env.example.`,
    );
  }

  const serverResult = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || undefined,
    STRIPE_LITE_PRICE_ID: process.env.STRIPE_LITE_PRICE_ID || undefined,
    STRIPE_BUSINESS_PRICE_ID: process.env.STRIPE_BUSINESS_PRICE_ID || undefined,
    STRIPE_ACCOUNTANT_PRICE_ID:
      process.env.STRIPE_ACCOUNTANT_PRICE_ID || undefined,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || undefined,
    RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
    EMAIL_FROM: process.env.EMAIL_FROM || undefined,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || undefined,
    CRON_SECRET: process.env.CRON_SECRET || undefined,
  });

  if (!serverResult.success) {
    const missing = serverResult.error.issues
      .map((i) => i.path.join("."))
      .join(", ");
    throw new Error(
      `Missing or invalid server environment variables: ${missing}. See .env.example.`,
    );
  }

  cached = { server: serverResult.data, public: publicResult.data };
  return cached;
}
