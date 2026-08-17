import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { serverEnv } from "@/lib/env/server";

import { isAllowedOwnerEmail } from "./owner-policy";

/** Definitive page-level authorization boundary; proxy is only an early gate. */
export async function requireOwnerSession() {
  const session = await auth();

  if (
    !session ||
    !isAllowedOwnerEmail(session.user?.email, serverEnv.OWNER_EMAIL)
  ) {
    redirect("/sign-in");
  }

  return session;
}
