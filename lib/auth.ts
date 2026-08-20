import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/infrastructure/db/prismaClient";
import bcrypt from "bcrypt";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials.email as string | undefined;
        const password = credentials.password as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: String(user.id),
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
        token.email = user.email;
      }
      if (trigger === "update" && session) {
        token.role = session.role ?? token.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      if (token.role) {
        (session.user as { role?: string }).role = token.role as string;
      }
      if (token.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (!user.email) return true;

      const adminEmails = process.env.ADMIN_EMAIL?.split(",") ?? [];

      // Admin auto-promotion
      if (adminEmails.includes(user.email)) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser && dbUser.role !== "ADMIN") {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { role: "ADMIN" },
          });
        }
      }

      // Link existing OAuth identity to existing password account
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          return true;
        }

        const role = adminEmails.includes(user.email) ? "ADMIN" : "USER";
        await prisma.user.create({
          data: {
            email: user.email,
            role,
            passwordHash: null as string | null,
          },
        });
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
});
