"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireActiveFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { availableTokenWhere } from "@/lib/tokens";
import {
  sendClaimConfirmationEmail,
  sendSlotClaimedNoticeEmail,
  sendSlotClaimedStaffEmail,
} from "@/lib/email";

export type ClaimState = { error?: string };

class SlotAlreadyClaimedError extends Error {}
class NoTokenAvailableError extends Error {}

export async function claimAbsence(
  _prevState: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const family = await requireActiveFamily();

  const absenceId = String(formData.get("absenceId") ?? "");
  const childId = String(formData.get("childId") ?? "");

  const child = family.children.find((kid) => kid.id === childId);

  if (!child) {
    return { error: "Select a valid kid." };
  }

  if (!absenceId) {
    return { error: "Missing absence." };
  }

  let claimedDate: Date;
  let postingFamilyEmail: string;
  let postingFamilyName: string;
  let postingChildName: string;

  try {
    const claim = await prisma.$transaction(async (tx) => {
      // Atomic compare-and-swap: this UPDATE only affects a row if it is
      // still OPEN and not this family's own posting. Under Postgres's
      // default READ COMMITTED isolation, a second concurrent UPDATE on the
      // same row blocks until the first transaction commits, then
      // re-evaluates this WHERE clause against the now-committed row — so
      // of two simultaneous claims on the same absence, exactly one ever
      // sees count === 1. No SERIALIZABLE / retry loop needed.
      const claimedAbsence = await tx.absence.updateMany({
        where: {
          id: absenceId,
          status: "OPEN",
          familyId: { not: family.id },
          family: { active: true },
        },
        data: { status: "CLAIMED" },
      });

      if (claimedAbsence.count === 0) {
        throw new SlotAlreadyClaimedError();
      }

      const token = await tx.token.findFirst({
        where: { familyId: family.id, ...availableTokenWhere(new Date()) },
        orderBy: { expiresAt: "asc" },
      });

      if (!token) {
        throw new NoTokenAvailableError();
      }

      // Same compare-and-swap pattern, in case this family is claiming two
      // slots at once with only one spendable token between them, or staff
      // revokes this exact token in the split second between these calls.
      const usedToken = await tx.token.updateMany({
        where: { id: token.id, usedAt: null, revokedAt: null },
        data: { usedAt: new Date() },
      });

      if (usedToken.count === 0) {
        throw new NoTokenAvailableError();
      }

      return tx.claim.create({
        data: {
          absenceId,
          claimingFamilyId: family.id,
          claimingChildId: child.id,
          tokenId: token.id,
        },
        include: {
          absence: {
            select: {
              date: true,
              family: { select: { email: true, name: true } },
              child: { select: { name: true } },
            },
          },
        },
      });
    });

    claimedDate = claim.absence.date;
    postingFamilyEmail = claim.absence.family.email;
    postingFamilyName = claim.absence.family.name;
    postingChildName = claim.absence.child.name;
  } catch (err) {
    if (err instanceof SlotAlreadyClaimedError) {
      return { error: "This slot was just claimed by someone else." };
    }

    if (err instanceof NoTokenAvailableError) {
      return { error: "You don't have any makeup tokens available." };
    }

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "This slot was just claimed by someone else." };
    }

    return {
      error: "Something went wrong claiming this slot. Please try again.",
    };
  }

  // Best-effort notifications — a Resend failure must never undo or fail a
  // claim that already committed, so each send is isolated in its own
  // try/catch and only logged on failure.
  try {
    await sendClaimConfirmationEmail({
      to: family.email,
      childName: child.name,
      absenceDate: claimedDate,
    });
  } catch (err) {
    console.error("Failed to send claim confirmation email:", err);
  }

  try {
    await sendSlotClaimedNoticeEmail({
      to: postingFamilyEmail,
      absenceDate: claimedDate,
    });
  } catch (err) {
    console.error("Failed to send slot claimed notice email:", err);
  }

  try {
    await sendSlotClaimedStaffEmail({
      postingFamilyName,
      postingChildName,
      claimingFamilyName: family.name,
      claimingChildName: child.name,
      absenceDate: claimedDate,
    });
  } catch (err) {
    console.error("Failed to send slot claimed staff email:", err);
  }

  redirect(`/?claimed=1&slotDate=${encodeURIComponent(claimedDate.toISOString())}`);
}
