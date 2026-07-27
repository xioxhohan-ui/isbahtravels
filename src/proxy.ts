import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rate limiting in-memory map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";

  // 1. API RATE LIMITING (100 requests / minute / IP)
  if (pathname.startsWith("/api/")) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100;

    const record = rateLimitMap.get(ip);
    if (record && record.resetTime > now) {
      if (record.count >= maxRequests) {
        return new NextResponse(
          JSON.stringify({ error: "Too many API requests. Rate limit exceeded (100 req/min)." }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "60",
              "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
              "X-Frame-Options": "DENY",
              "X-Content-Type-Options": "nosniff",
            },
          }
        );
      }
      record.count++;
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. CORS HARDENING (Exact Domain, No Wildcard *)
  const origin = request.headers.get("origin") || "";
  const allowedOrigins = [
    "https://isbahtravels.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  if (allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
    response.headers.set("Access-Control-Allow-Origin", origin || "https://isbahtravels.vercel.app");
  } else {
    response.headers.set("Access-Control-Allow-Origin", "https://isbahtravels.vercel.app");
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  // 3. MANDATORY CRITICAL SECURITY HEADERS & HSTS PRELOAD
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.google.com https://*.vercel-scripts.com https://*.vercel-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://*.sslcommerz.com https://*.googleapis.com https://flagcdn.com https://*.vercel-analytics.com; frame-ancestors 'none'; block-all-mixed-content;"
  );

  // 4. COOKIE SECURITY (Secure, HttpOnly, SameSite=Strict)
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
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, {
                ...options,
                sameSite: "strict",
                secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
                httpOnly: true,
              });
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

  // 5. PROTECTED ADMIN & USER ROUTES
  if (pathname.startsWith("/isbah/") && pathname !== "/isbah") {
    const adminSession = request.cookies.get("isbah_admin_session")?.value;
    if (adminSession !== "authenticated") {
      const url = request.nextUrl.clone();
      url.pathname = "/isbah";
      return NextResponse.redirect(url);
    }
  }

  const protectedUserRoutes = ["/profile", "/dashboard", "/checkout"];
  const isProtectedRoute = protectedUserRoutes.some((route) => pathname.startsWith(route));
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
