import { prisma } from "@/lib/prisma";
import { hoursBetween } from "@/lib/timezone";

// Parent self-release requires the absence to still be at least this many
// hours away; the staff-facing release has no such cutoff.
export const RELEASE_CUTOFF_HOURS = 48;

// If a claim is released within this many hours of the lesson, the token
// is forfeited (marked forfeitedAt) instead of being returned to
// Available. Deliberately a separate constant from MINIMUM_NOTICE_HOURS
// even though both are 12 right now — they govern unrelated flows
// (earning a token vs. losing one already spent).
export const FORFEIT_CUTOFF_HOURS = 12;

/**
 * True undo of a claim: deletes the Claim row, reopens the Absence, and
 * either clears the Token's usedAt (expiresAt is left untouched —
 * releasing doesn't grant extra time) or, if released within
 * FORFEIT_CUTOFF_HOURS of the lesson, marks the Token forfeited instead —
 * it really was used, just too close to the lesson to give back. Shared
 * by the parent self-release action (gated at a notice cutoff by its
 * caller) and the staff override (no cutoff) so both paths are
 * guaranteed identical undo behavior.
 *
 * `tx.claim.delete` throws Prisma's P2025 ("record not found") if the
 * claim is already gone — e.g. a double-click, or a second concurrent
 * release attempt — which callers use as the "already released" signal.
 */
export async function releaseClaim(claimId: string) {
  return prisma.$transaction(async (tx) => {
    const claim = await tx.claim.delete({
      where: { id: claimId },
      include: {
        absence: {
          select: {
            date: true,
            family: { select: { email: true, name: true } },
            child: { select: { name: true } },
          },
        },
        claimingFamily: { select: { email: true, name: true } },
        claimingChild: { select: { name: true } },
      },
    });

    await tx.absence.update({
      where: { id: claim.absenceId },
      data: { status: "OPEN" },
    });

    const forfeited =
      hoursBetween(new Date(), claim.absence.date) <= FORFEIT_CUTOFF_HOURS;

    if (forfeited) {
      await tx.token.update({
        where: { id: claim.tokenId },
        data: { forfeitedAt: new Date() },
      });
    } else {
      await tx.token.update({
        where: { id: claim.tokenId },
        data: { usedAt: null },
      });
    }

    return { ...claim, forfeited };
  });
}
