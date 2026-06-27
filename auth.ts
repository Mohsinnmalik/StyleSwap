// auth.ts — Node.js only. DO NOT import this in middleware.ts.
// Used in: API routes, Server Components, Server Actions.
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig, // extends edge-safe config (pages, session, callbacks)
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();

        const user = await User.findOne({ email: String(credentials.email).toLowerCase() }).lean();

        if (!user) return null;

        const valid = await bcrypt.compare(String(credentials.password), user.password);
        if (!valid) return null;

        return {
          id:     user._id.toString(),
          email:  user.email,
          name:   user.name,
          role:   user.role,
          shopId: user.shop_id ? user.shop_id.toString() : '',
        };
      },
    }),
  ],
});
