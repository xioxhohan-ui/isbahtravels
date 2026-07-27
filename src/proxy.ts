import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Attach Security Headers to every response
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  let user = null;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
            response = NextResponse.next({
              request,
            });
            // Re-attach security headers on updated response
            response.headers.set("X-Frame-Options", "DENY");
            response.headers.set("X-Content-Type-Options", "nosniff");
            response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
            response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    } catch (error) {
      console.error("Proxy Supabase client error:", error);
    }
  }

  const pathname = request.nextUrl.pathname;

  // Protect Admin Console routes (/isbah/...) except login (/isbah)
  if (pathname.startsWith("/isbah/") && pathname !== "/isbah") {
    const adminSession = request.cookies.get("isbah_admin_session")?.value;
    if (adminSession !== "authenticated") {
      const url = request.nextUrl.clone();
      url.pathname = "/isbah";
      return NextResponse.redirect(url);
    }
  }

  // Protect Customer user routes (/profile, /dashboard, /checkout)
  const protectedUserRoutes = ["/profile", "/dashboard", "/checkout"];
  const isProtectedRoute = protectedUserRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Fallback check for legacy cookie or active Supabase user session
  const legacySession = request.cookies.get("isbah_user_session")?.value;
  const isAuthenticated = !!user || !!legacySession;

  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
