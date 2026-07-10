// ─── In-Memory Rate Limiter ───────────────────────────────────────────────────
// Fixed window per bucket: e.g. max 5 requests per IP per 10 minutes.
// NOTE: Resets on server restart. For multi-instance production, use Upstash Redis.

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const DEFAULT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_MAX_REQUESTS = 5;

const store = new Map<string, RateLimitEntry>();

// Evict expired entries so the map does not grow without bound
const MAX_STORE_SIZE = 10_000;
function evictExpired(now: number, maxWindowMs: number) {
  if (store.size < MAX_STORE_SIZE) return;
  store.forEach((entry, key) => {
    if (now - entry.windowStart >= maxWindowMs) store.delete(key);
  });
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetInMs: number;
}

export interface RateLimitOptions {
  /** Separate buckets for different endpoints share the same store via a prefix */
  bucket?: string;
  windowMs?: number;
  maxRequests?: number;
}

export function checkRateLimit(ip: string, opts: RateLimitOptions = {}): RateLimitResult {
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
  const max      = opts.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const key      = `${opts.bucket ?? 'default'}:${ip}`;

  const now = Date.now();
  evictExpired(now, Math.max(windowMs, DEFAULT_WINDOW_MS));
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { limited: false, remaining: max - 1, resetInMs: windowMs };
  }

  if (entry.count >= max) {
    return { limited: true, remaining: 0, resetInMs: windowMs - (now - entry.windowStart) };
  }

  entry.count += 1;
  return { limited: false, remaining: max - entry.count, resetInMs: windowMs - (now - entry.windowStart) };
}

export function getClientIp(req: Request): string {
  // Platform-set IP (trustworthy on Vercel); header fallbacks are spoofable
  // but only affect rate limiting, not auth.
  const ip = (req as any).ip;
  if (ip) return ip;
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? '127.0.0.1';
}

export const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
