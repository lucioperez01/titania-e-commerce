import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe NextAuth configuration.
 *
 * This file MUST NOT import Prisma, bcrypt, or any Node.js-only module.
 * It is consumed by proxy.ts (edge middleware) via the auth() wrapper and
 * by lib/auth.ts (full server config) via object spread.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
};
