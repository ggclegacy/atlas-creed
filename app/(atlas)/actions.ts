"use server";

import { signOut } from "@/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOwner } from "@/lib/auth/guards";
import { archiveConversation } from "@/lib/conversation/service";

export async function signOutOwner(): Promise<void> {
  await signOut({ redirectTo: "/sign-in" });
}

export async function archiveConversationAction(
  conversationId: string,
): Promise<void> {
  const id = z.uuid().parse(conversationId);
  const owner = await requireOwner();
  await archiveConversation(owner.id, id);
  redirect("/");
}
