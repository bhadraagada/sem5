import { db } from "@/server/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { env } from "~/env";

const FACULTY_DOMAIN = "jaihindcollege.edu.in";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      state: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    state: string;
  }
}

async function handleGoogleLogin(profile: any) {
  const email = profile.email!;
  const isFaculty = email.endsWith(`@${FACULTY_DOMAIN}`);

  let user = await db.user.findUnique({ where: { email } });

  // ---------- first ever login => bootstrap college admin ----------
  if (!user && (await db.user.count()) === 0) {
    user = await db.user.create({
      data: {
        email,
        googleId: profile.sub,
        name: profile.name,
        photoUrl: profile.picture,
        role: "ORG_ADMIN",
        state: "PENDING", // will complete wizard
      },
    });
    return true;
  }

  // ---------- faculty auto-provision ----------
  if (!user && isFaculty) {
    user = await db.user.create({
      data: {
        email,
        googleId: profile.sub,
        name: profile.name,
        photoUrl: profile.picture,
        role: "DEPT_COORD",
        state: "PENDING", // teacher wizard
      },
    });
    return true;
  }

  // ---------- club member / unknown e-mail ----------
  if (!user) {
    user = await db.user.create({
      data: {
        email,
        googleId: profile.sub,
        name: profile.name,
        photoUrl: profile.picture,
        role: "CLUB_MEMBER",
        state: "PENDING",
      },
    });
    // TODO: notifyAdminsForApproval(user.email)
    return true;
  }

  // existing user: update googleId if missing
  if (!user.googleId) {
    await db.user.update({
      where: { id: user.id },
      data: { googleId: profile.sub },
    });
  }
  return true;
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid || user.state !== "ACTIVE") {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.photoUrl,
          role: user.role,
          state: user.state,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as any).role;
        token.state = (user as any).state;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.uid;
        (session.user as any).role = token.role;
        (session.user as any).state = token.state;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        return await handleGoogleLogin(profile);
      }
      // credentials handled in authorize
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
} satisfies NextAuthConfig;
