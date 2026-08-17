"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOwner } from "@/lib/auth/guards";
import { bootstrapConstitutionalFoundation } from "@/lib/constitutional/bootstrap";
import { CONSTITUTION_INITIALIZATION_PHRASE } from "@/lib/constitutional/confirmations";
import {
  activateConstitutionalAmendment,
  approveConstitutionalAmendment,
} from "@/lib/constitutional/amendments";

const confirmationSchema = z.literal(CONSTITUTION_INITIALIZATION_PHRASE);

export async function initializeConstitutionAction(
  formData: FormData,
): Promise<void> {
  const owner = await requireOwner();
  confirmationSchema.parse(formData.get("confirmation"));
  await bootstrapConstitutionalFoundation(owner.id);
  redirect("/brain?initialized=1");
}

export async function approveAmendmentAction(
  formData: FormData,
): Promise<void> {
  const owner = await requireOwner();
  const amendmentId = z.uuid().parse(formData.get("amendmentId"));
  const confirmation = z.string().parse(formData.get("confirmation"));
  await approveConstitutionalAmendment({
    ownerId: owner.id,
    amendmentId,
    confirmation,
  });
  redirect("/brain?amendment=approved");
}

export async function activateAmendmentAction(
  formData: FormData,
): Promise<void> {
  const owner = await requireOwner();
  const amendmentId = z.uuid().parse(formData.get("amendmentId"));
  const confirmation = z.string().parse(formData.get("confirmation"));
  const evaluationEvidence = z
    .string()
    .parse(formData.get("evaluationEvidence"));
  await activateConstitutionalAmendment({
    ownerId: owner.id,
    amendmentId,
    confirmation,
    evaluationEvidence,
  });
  redirect("/brain?amendment=activated");
}
