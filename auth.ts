import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";

import { isAllowedOwnerEmail } from "@/lib/auth/owner-policy";
import { getDatabase } from "@/lib/db/client";
import {
  accounts,
  owners,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";
import { getServerEnv } from "@/lib/env/server";

export const { auth, handlers, signIn, signOut } = NextAuth(() => {
  const env = getServerEnv();

  return {
    secret: env.AUTH_SECRET,
    adapter: DrizzleAdapter(getDatabase(), {
      usersTable: owners,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    providers: [
      Resend({
        apiKey: env.AUTH_RESEND_KEY,
        from: env.AUTH_EMAIL_FROM,
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
        return isAllowedOwnerEmail(user.email, env.OWNER_EMAIL);
      },
      authorized({ auth: session }) {
        return isAllowedOwnerEmail(session?.user?.email, env.OWNER_EMAIL);
      },
    },
  };
});
