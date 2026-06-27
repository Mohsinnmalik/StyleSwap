// ─── In-Memory Rate Limiter ───────────────────────────────────────────────────
// Sliding window: max 5 requests per IP per 10 minutes
// NOTE: Resets on server restart. For multi-instance production, use Upstash Redis.

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const WINDOW_MS  = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 5;

const store = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetInMs: number;
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now   = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    store.set(ip, { count: 1, windowStart: now });
    return { limited: false, remaining: MAX_REQUESTS - 1, resetInMs: WINDOW_MS };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { limited: true, remaining: 0, resetInMs: WINDOW_MS - (now - entry.windowStart) };
  }

  entry.count += 1;
  store.set(ip, entry);
  return { limited: false, remaining: MAX_REQUESTS - entry.count, resetInMs: WINDOW_MS - (now - entry.windowStart) };
}

export function getClientIp(req: Request): string {
  const ip = (req as any).ip;
  if (ip) return ip;
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? '127.0.0.1';
}

export const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
