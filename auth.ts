import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";

import { isAllowedOwnerEmail } from "@/lib/auth/owner-policy";
import { db } from "@/lib/db/client";
import {
  accounts,
  owners,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: owners,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      apiKey: serverEnv.AUTH_RESEND_KEY,
      from: serverEnv.AUTH_EMAIL_FROM,
      maxAge: 15 * 60,
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in/check-email",
    error: "/sign-in/error",
  },
  callbacks: {
    signIn({ user }) {
      return isAllowedOwnerEmail(user.email, serverEnv.OWNER_EMAIL);
    },
    authorized({ auth: session }) {
      return isAllowedOwnerEmail(session?.user?.email, serverEnv.OWNER_EMAIL);
    },
  },
});
