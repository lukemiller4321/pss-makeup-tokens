"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireStaffFamily } from "@/lib/staff";
import { releaseClaim } from "@/lib/release-claim";
import {
  sendSlotReleasedNoticeEmail,
  sendClaimReleasedStaffEmail,
} from "@/lib/email";

export type ReleaseClaimState = { error?: string };

export async function releaseClaimAsStaff(
  _prevState: ReleaseClaimState,
  formData: FormData,
): Promise<ReleaseClaimState> {
  await requireStaffFamily();

  const claimId = String(formData.get("claimId") ?? "");

  let released;

  try {
    // No notice cutoff for staff — that's the whole point of this tool.
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
      releasedBy: "staff",
    });
  } catch (err) {
    console.error("Failed to send claim released staff email:", err);
  }

  revalidatePath("/admin");

  return {};
}
