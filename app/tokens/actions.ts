"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireActiveFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { hoursBetween } from "@/lib/timezone";
import { releaseClaim, RELEASE_CUTOFF_HOURS } from "@/lib/release-claim";
import {
  sendSlotReleasedNoticeEmail,
  sendClaimReleasedStaffEmail,
} from "@/lib/email";

export type ReleaseClaimState = { error?: string };

export async function releaseOwnClaim(
  _prevState: ReleaseClaimState,
  formData: FormData,
): Promise<ReleaseClaimState> {
  const family = await requireActiveFamily();

  const claimId = String(formData.get("claimId") ?? "");

  // Never trust the client — re-verify this claim actually belongs to the
  // signed-in family, and re-check the notice cutoff server-side rather
  // than trusting that the button was only shown when it should be.
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: { claimingFamilyId: true, absence: { select: { date: true } } },
  });

  if (!claim || claim.claimingFamilyId !== family.id) {
    return { error: "Claim not found." };
  }

  if (hoursBetween(new Date(), claim.absence.date) <= RELEASE_CUTOFF_HOURS) {
    return {
      error:
        "This is too close to the lesson to release online — please contact the school directly.",
    };
  }

  let released;

  try {
    released = await releaseClaim(claimId);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return { error: "This claim was already released." };
    }

    return { error: "Something went wrong. Please try again." };
  }

  // Best-effort notifications — a Resend failure must never affect the
  // release that already committed.
  try {
    await sendSlotReleasedNoticeEmail({
      to: released.absence.family.email,
      absenceDate: released.absence.date,
    });
  } catch (err) {
    console.error("Failed to send slot released notice email:", err);
  }

  try {
    await sendClaimReleasedStaffEmail({
      postingFamilyName: released.absence.family.name,
      postingChildName: released.absence.child.name,
      claimingFamilyName: released.claimingFamily.name,
      claimingChildName: released.claimingChild.name,
      absenceDate: released.absence.date,
      releasedBy: "family",
    });
  } catch (err) {
    console.error("Failed to send claim released staff email:", err);
  }

  revalidatePath("/tokens");

  return {};
}
