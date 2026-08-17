import "server-only";

import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getDatabase } from "@/lib/db/client";
import { owners } from "@/lib/db/schema";
import { getServerEnv } from "@/lib/env/server";

import { isAllowedOwnerEmail, normalizedOwnerEmail } from "./owner-policy";

export interface AuthenticatedOwner {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
}

/** Returns the authoritative database owner for the current secure session. */
export async function getAuthenticatedOwner(): Promise<AuthenticatedOwner | null> {
  const session = await auth();
  const env = getServerEnv();
  const email = session?.user?.email;

  if (!isAllowedOwnerEmail(email, env.OWNER_EMAIL) || !email) return null;

  const [owner] = await getDatabase()
    .select({ id: owners.id, email: owners.email, name: owners.name })
    .from(owners)
    .where(sql`lower(${owners.email}) = ${normalizedOwnerEmail(email)}`)
    .limit(1);

  return owner ?? null;
}

export async function requireOwner(): Promise<AuthenticatedOwner> {
  const owner = await getAuthenticatedOwner();
  if (!owner) redirect("/sign-in");
  return owner;
}
