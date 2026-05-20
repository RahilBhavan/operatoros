import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  getSupabasePublicConfig,
  isSupabasePublicConfigured,
} from "@/lib/supabase/config";
import { buildCsp, generateNonce } from "@/lib/security/csp";

const PROTECTED = ["/dashboard", "/deadlines", "/billing", "/onboarding", "/settings"];
const AUTH_ONLY = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate a fresh nonce per request. We propagate it on the inbound headers
  // so Next.js auto-nonces its built-in <script> tags, and we set CSP on the
  // outbound response so the browser enforces it.
  const nonce = generateNonce();
  const cspMode = process.env.NODE_ENV === "production" ? "prod" : "dev";
  const csp = buildCsp(nonce, cspMode);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const nextOpts = { request: { headers: requestHeaders } };
  let response = NextResponse.next(nextOpts);
  response.headers.set("Content-Security-Policy", csp);

  if (!isSupabasePublicConfigured()) {
    return response;
  }

  try {
    const { url, anonKey } = getSupabasePublicConfig();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next(nextOpts);
          response.headers.set("Content-Security-Policy", csp);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
    const isAuthPage = AUTH_ONLY.some((p) => pathname.startsWith(p));

    if (isProtected && !user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (isAuthPage && user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch (error) {
    console.error("[proxy] Supabase auth skipped:", error);
  }

  return response;
}

export const config = {
  // Static/PWA paths excluded so sw.js and share/accountant token routes skip auth proxy.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon\\.ico|icon\\.svg|apple-icon|apple-touch-icon|apple-touch-icon-precomposed|manifest\\.webmanifest|sw\\.js|offline\\.html|robots\\.txt|sitemap\\.xml|opengraph-image|twitter-image|api|share|accountant).*)",
  ],
};
