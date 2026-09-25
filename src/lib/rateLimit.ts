interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Checks if a key (e.g. IP or IP+action) is rate limited.
 * @param key Unique key to track (e.g. `ip:login`)
 * @param maxRequests Maximum requests allowed within window
 * @param windowMs Window duration in milliseconds (default 60s)
 * @returns { success: boolean, remaining: number, resetInSec: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60 * 1000
): { success: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      remaining: maxRequests - 1,
      resetInSec: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= maxRequests) {
    const resetInSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      success: false,
      remaining: 0,
      resetInSec,
    };
  }

  record.count += 1;
  const resetInSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
  return {
    success: true,
    remaining: maxRequests - record.count,
    resetInSec,
  };
}
