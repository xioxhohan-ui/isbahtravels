// In-memory sliding-window rate limiter for serverless API routes
const tracker = new Map<string, { count: number; expiresAt: number }>();

/**
 * Checks rate limiting for an identifier (e.g. client IP or user ID).
 * Default for standard endpoints: 20 calls / 1 minute.
 * Default for auth endpoints (sign-in/sign-up): 5 calls / 15 minutes.
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 20,
  windowMs: number = 60 * 1000
): { success: boolean; remaining: number; retryAfterSec?: number } {
  const now = Date.now();
  const entry = tracker.get(identifier);

  if (!entry || now > entry.expiresAt) {
    tracker.set(identifier, { count: 1, expiresAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    const retryAfterSec = Math.ceil((entry.expiresAt - now) / 1000);
    return { success: false, remaining: 0, retryAfterSec };
  }

  entry.count += 1;
  tracker.set(identifier, entry);
  return { success: true, remaining: limit - entry.count };
}

/**
 * Specialized Rate Limiter for Authentication endpoints (Sign In, Sign Up, Password Reset)
 * Policy: 5 attempts per IP per 15 minutes (900,000 ms)
 */
export function checkAuthRateLimit(ipOrEmail: string) {
  return checkRateLimit(`auth_${ipOrEmail}`, 5, 15 * 60 * 1000);
}
