import slugify from 'slugify';
/** Generate a URL-safe slug from a shop name */
export function generateSlug(name: string): string {
  return slugify(name, { lower: true, strict: true, trim: true });
}


/** Format a countdown from milliseconds to M:SS */
export function formatCountdown(ms: number): string {
  const total   = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Format currency */
export function formatPrice(price: number, currency = '₹'): string {
  return `${currency}${price.toLocaleString('en-IN')}`;
}

/** Check if a string is a valid 6-digit code */
export function isValidCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}
