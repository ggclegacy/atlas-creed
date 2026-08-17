import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getServerEnv } from "@/lib/env/server";

import { isAllowedOwnerEmail } from "./owner-policy";

/** Definitive page-level authorization boundary; proxy is only an early gate. */
export async function requireOwnerSession() {
  const session = await auth();
  const env = getServerEnv();

  if (!session || !isAllowedOwnerEmail(session.user?.email, env.OWNER_EMAIL)) {
    redirect("/sign-in");
  }

  return session;
}
