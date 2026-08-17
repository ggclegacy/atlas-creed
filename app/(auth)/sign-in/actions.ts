"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn } from "@/auth";
import { isAllowedOwnerEmail } from "@/lib/auth/owner-policy";
import { getServerEnv } from "@/lib/env/server";

const emailSchema = z.email();

export async function requestMagicLink(formData: FormData): Promise<void> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  const env = getServerEnv();

  if (!parsed.success || !isAllowedOwnerEmail(parsed.data, env.OWNER_EMAIL)) {
    redirect("/sign-in/check-email");
  }

  await signIn("resend", { email: parsed.data, redirectTo: "/" });
}
