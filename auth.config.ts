// auth.config.ts — Edge Runtime compatible (NO Mongoose, NO Node.js APIs)
// Used by middleware.ts which runs in the Edge Runtime.
// The full auth.ts (with Mongoose + bcrypt) is used only in API routes / server components.

import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn  = !!auth?.user;
      const isDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isAuthPage  = nextUrl.pathname === '/login' || nextUrl.pathname === '/signup';

      if (isDashboard) {
        // Not logged in → redirect to /login
        if (!isLoggedIn) return false;
        return true;
      }

      if (isAuthPage && isLoggedIn) {
        // Already logged in → redirect to /dashboard
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id     = (user as { id: string }).id;
        token.role   = (user as { role?: string }).role;
        token.shopId = (user as { shopId?: string }).shopId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Create a new object to avoid read-only mutation errors
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          shopId: token.shopId as string,
        } as any;
      }
      return session;
    },
  },
  providers: [], // Providers are defined in auth.ts — not needed here
};
