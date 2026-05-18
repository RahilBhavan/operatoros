"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkAuthRateLimit } from "@/lib/security/auth-rate-limit";
import { Wordmark } from "@/components/doctrine/Wordmark";
import { Button } from "@/components/doctrine/Button";
import { StampChip } from "@/components/doctrine/StampChip";
import { FormField } from "@/components/doctrine/FormField";

const RATE_LIMITED_MESSAGE =
  "Too many attempts. Wait 15 minutes before trying again, or reset your password.";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const gate = await checkAuthRateLimit("signin", email);
    if (!gate.allowed) {
      setError(RATE_LIMITED_MESSAGE);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError("");
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-field)] flex flex-col">
      <header className="border-b border-[var(--color-ground)] px-6 py-5">
        <div className="max-w-[1160px] mx-auto">
          <Wordmark size={20} />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[480px]">
          <div className="border-2 border-[var(--color-ground)]">
            <div className="panel-ink px-7 pt-6 pb-7">
              <div className="flex items-center justify-between mb-5">
                <StampChip tone="mark">Access · return</StampChip>
                <span
                  className="t-utility"
                  style={{ color: "var(--color-field)" }}
                >
                  Sector · A
                </span>
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-destination)",
                  fontWeight: 900,
                  fontSize: 60,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  color: "var(--color-field)",
                }}
              >
                Sign in.
              </h1>
              <div
                className="mt-3 text-[15px]"
                style={{
                  fontFamily: "var(--font-index)",
                  color: "var(--color-field)",
                }}
              >
                No account?{" "}
                <Link
                  href="/sign-up"
                  className="underline decoration-[var(--color-mark)] underline-offset-4 hover:text-[var(--color-mark)]"
                  style={{ color: "var(--color-field)" }}
                >
                  Start free trial →
                </Link>
              </div>
            </div>

            <div className="bg-[var(--color-field)] text-[var(--color-ground)] px-7 py-7">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading || loading}
                className="w-full btn btn-ghost mb-5"
              >
                <GoogleIcon />
                {googleLoading ? "Redirecting…" : "Continue with Google"}
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 border-t border-[var(--color-ground)]" />
                <span className="t-utility text-[var(--color-ground)]">Or</span>
                <div className="flex-1 border-t border-[var(--color-ground)]" />
              </div>

              <form onSubmit={handleSignIn} className="flex flex-col gap-5">
                <FormField label="Email" htmlFor="email">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@business.com"
                    className="t-input"
                    autoComplete="email"
                  />
                </FormField>

                <FormField label="Password" htmlFor="password">
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="t-input"
                    autoComplete="current-password"
                  />
                </FormField>

                {error ? (
                  <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-4 py-3">
                    <div
                      className="t-utility mb-1"
                      style={{ color: "var(--color-field)" }}
                    >
                      Error
                    </div>
                    <p
                      className="text-[14px]"
                      style={{
                        fontFamily: "var(--font-index)",
                        color: "var(--color-field)",
                      }}
                    >
                      {error}
                    </p>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  variant="ground"
                  size="lg"
                  disabled={loading || googleLoading}
                  className="w-full"
                >
                  {loading ? "Signing in…" : "Sign in →"}
                </Button>
              </form>
            </div>
          </div>

          <div className="mt-6 t-utility text-[var(--color-ground)]">
            <Link href="/" className="t-link">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
