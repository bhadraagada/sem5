/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { db } from "@/server/db";
import { type Role, type UserState } from "@/types/next-auth";
import { type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { sendOrgAdminNotification } from "../../lib/email";

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google" || !profile?.email) {
        return false;
      }

      // Extract tenant slug from the URL or use a default
      // In a real app, this would come from the request URL
      const tenantSlug = process.env.DEFAULT_TENANT_SLUG ?? "default";

      try {
        // Find or create tenant
        let tenant = await db.tenant.findUnique({
          where: { slug: tenantSlug },
        });

        tenant ??= await db.tenant.create({
            data: {
              name: `Default College`,
              slug: tenantSlug,
            },
          });

        // Check if user already exists
        const existingUser = await db.user.findUnique({
          where: { email: profile.email },
          include: { tenant: true },
        });

        if (existingUser) {
          // Update googleId if not set
          if (!existingUser.googleId && account.providerAccountId) {
            await db.user.update({
              where: { id: existingUser.id },
              data: { googleId: account.providerAccountId },
            });
          }
          return true;
        }

        // Create new user with PENDING state
        const newUser = await db.user.create({
          data: {
            email: profile.email,
            name: profile.name ?? profile.email.split("@")[0] ?? "Unknown",
            image: profile.picture,
            googleId: account.providerAccountId ?? "",
            tenantId: tenant.id,
            role: "CLUB_MEMBER",
            state: "PENDING",
          },
        });

        // Notify org admins about new user signup
        await sendOrgAdminNotification(tenant.id, newUser);

        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },

    async jwt({ token, user, trigger }) {
      if (user?.email) {
        // First time JWT creation or refresh
        const dbUser = await db.user.findUnique({
          where: { email: user.email },
          include: { tenant: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.tenantId = dbUser.tenantId;
          token.role = dbUser.role as Role;
          token.state = dbUser.state as UserState;
          token.googleId = dbUser.googleId;
        }
      }

      // Refresh user data on update trigger
      if (trigger === "update" && token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          include: { tenant: true },
        });

        if (dbUser) {
          token.role = dbUser.role as Role;
          token.state = dbUser.state as UserState;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.tenantId = token.tenantId as string;
        session.user.role = token.role as Role;
        session.user.state = token.state as UserState;
        session.user.googleId = token.googleId as string;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle pending users
      if (url.includes("pending")) {
        return `${baseUrl}/pending`;
      }

      // Default redirect
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        console.log(`New user signed up: ${user.email}`);
      }
    },
  },
} satisfies NextAuthConfig;
