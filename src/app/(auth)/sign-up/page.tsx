"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Destination,
  H2,
  Body,
  Caption,
  Utility,
  Index,
  Button,
} from "@/components/doctrine";

function SignUpInner() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "accountant" ? "accountant" : "customer";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const isAccountant = role === "accountant";

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("operatoros:signup_role", role);
    }
  }, [role]);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=/onboarding${
          isAccountant ? "?role=accountant" : ""
        }`,
        data: { signup_role: role },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    setDone(true);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError("");
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding${
          isAccountant ? "?role=accountant" : ""
        }`,
        queryParams: { signup_role: role },
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[var(--color-field)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[480px] border-2 border-[var(--color-ground)]">
          <div className="bg-[var(--color-mark)] text-[var(--color-field)] px-7 py-8">
            <Utility className="!opacity-80 mb-3">CONFIRMATION SENT</Utility>
            <Destination className="!text-[var(--color-field)] !text-[60px] !leading-none mb-3">
              CHECK<br />YOUR<br />EMAIL.
            </Destination>
          </div>
          <div className="bg-[var(--color-field)] px-7 py-7">
            <Body className="mb-2">
              We&apos;ve sent a confirmation link to:
            </Body>
            <Index className="!text-[19px]">{email}</Index>
            <Caption className="!mt-4 !opacity-70">
              Click it to activate your account.
            </Caption>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-field)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[480px]">
        <Link href="/" className="flex items-baseline gap-3 mb-10 justify-center">
          <span className="t-h1 font-black tracking-tight">
            OPERATOR<span className="text-[var(--color-mark)]">OS</span>
          </span>
        </Link>

        <div className="border-2 border-[var(--color-ground)]">
          <div className={`px-7 pt-6 pb-7 text-[var(--color-field)] ${isAccountant ? "bg-[var(--color-mark)]" : "bg-[var(--color-ground)]"}`}>
            <div className="flex items-center justify-between mb-6">
              <Index className="!text-[12px] !text-[var(--color-field)] opacity-80">
                {isAccountant ? "A-299 / ACCOUNTANT" : "B-079 / BUSINESS"}
              </Index>
              <span className="tag-tab -mt-6">SIGN-UP</span>
              <Utility className="opacity-80">SECTOR · {isAccountant ? "B" : "A"}</Utility>
            </div>
            <Destination className="!text-[var(--color-field)] !text-[60px] !leading-none">
              {isAccountant ? "JOIN.\nLEAD." : "BEGIN."}
            </Destination>
            <Caption className="!text-[var(--color-field)] !opacity-80 !mt-3">
              {isAccountant ? (
                <>
                  Managing clients?{" "}
                  <Link href="/sign-up" className="t-link !text-[var(--color-field)] !decoration-current">
                    Business account →
                  </Link>
                </>
              ) : (
                <>
                  Already here?{" "}
                  <Link href="/sign-in" className="t-link !text-[var(--color-field)] !decoration-[var(--color-mark)]">
                    Sign in →
                  </Link>
                </>
              )}
            </Caption>
          </div>

          <div className="bg-[var(--color-field)] text-[var(--color-ground)] px-7 py-7">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full btn btn-ghost mb-5 justify-center"
            >
              <GoogleIcon />
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 border-t border-[var(--color-ground)] opacity-30" />
              <Utility className="opacity-50">OR</Utility>
              <div className="flex-1 border-t border-[var(--color-ground)] opacity-30" />
            </div>

            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="block t-utility mb-2">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  className="t-input"
                />
              </div>

              <div>
                <label htmlFor="password" className="block t-utility mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="t-input"
                />
              </div>

              {error && (
                <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-4 py-3">
                  <Utility className="!opacity-100 mb-1">ERROR</Utility>
                  <Body className="!text-[var(--color-field)] !text-[15px]">
                    {error}
                  </Body>
                </div>
              )}

              <Button type="submit" variant={isAccountant ? "mark" : "ground"} disabled={loading || googleLoading} className="w-full justify-center">
                {loading
                  ? "Creating…"
                  : isAccountant
                  ? "Create accountant account →"
                  : "Create free account →"}
              </Button>

              <Caption className="!opacity-60 text-center">
                By signing up you agree to our{" "}
                <Link href="/terms" className="t-link">Terms</Link> and{" "}
                <Link href="/privacy" className="t-link">Privacy Policy</Link>.
              </Caption>
            </form>
          </div>
        </div>

        <Caption className="!mt-6 text-center !opacity-60">
          <Link href="/" className="t-link">← Back to home</Link>
        </Caption>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpInner />
    </Suspense>
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
