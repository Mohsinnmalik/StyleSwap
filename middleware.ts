// middleware.ts — Edge Runtime
// IMPORTANT: Import from auth.config (edge-safe), NOT from auth.ts (uses Mongoose/Node.js).
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// NextAuth's auth() using only edge-compatible config handles redirects via the
// authorized() callback in auth.config.ts — no DB access needed here.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
