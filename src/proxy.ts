import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  getSupabasePublicConfig,
  isSupabasePublicConfigured,
} from "@/lib/supabase/config";

const PROTECTED = ["/dashboard", "/deadlines", "/billing", "/onboarding", "/settings"];
const AUTH_ONLY = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
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
