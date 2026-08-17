"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn } from "@/auth";
import { isAllowedOwnerEmail } from "@/lib/auth/owner-policy";
import { serverEnv } from "@/lib/env/server";

const emailSchema = z.email();

export async function requestMagicLink(formData: FormData): Promise<void> {
  const parsed = emailSchema.safeParse(formData.get("email"));

  // Both invalid and unauthorized addresses receive the same quiet response.
  // This avoids disclosing the configured owner while preventing email sends.
  if (
    !parsed.success ||
    !isAllowedOwnerEmail(parsed.data, serverEnv.OWNER_EMAIL)
  ) {
    redirect("/sign-in/check-email");
  }

  await signIn("resend", {
    email: parsed.data,
    redirectTo: "/",
  });
}
