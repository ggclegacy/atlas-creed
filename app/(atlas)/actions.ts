"use server";

import { signOut } from "@/auth";

export async function signOutOwner(): Promise<void> {
  await signOut({ redirectTo: "/sign-in" });
}
