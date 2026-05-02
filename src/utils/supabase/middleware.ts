import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "./public-env";

export const updateSession = async (request: NextRequest) => {
  const base = { request: { headers: request.headers } } as const;
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublishableKey();

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next(base);
  }

  try {
    let supabaseResponse = NextResponse.next(base);

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    // Use getUser() (not getSession()) — validates token server-side, prevents spoofing
    const { data: { user } } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;
    const isApplyRoute = pathname.startsWith("/apply");
    const isAuthRoute = pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup");

    // Protect /apply — redirect unauthenticated users to login
    if (isApplyRoute && !user) {
      const originalPath = pathname + (request.nextUrl.search || "");
      const loginUrl = new URL(`/auth/login?next=${encodeURIComponent(originalPath)}`, request.nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from login/signup
    if (isAuthRoute && user) {
      const nextParam = request.nextUrl.searchParams.get("next");
      const redirectTarget = nextParam && nextParam.startsWith("/") ? nextParam : "/apply";
      const redirectUrl = new URL(redirectTarget, request.nextUrl.origin);
      return NextResponse.redirect(redirectUrl);
    }

    return supabaseResponse;
  } catch {
    return NextResponse.next(base);
  }
};
