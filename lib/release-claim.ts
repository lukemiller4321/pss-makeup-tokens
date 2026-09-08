import { prisma } from "@/lib/prisma";

// Parent self-release requires the absence to still be at least this many
// hours away; the staff-facing release has no such cutoff.
export const RELEASE_CUTOFF_HOURS = 48;

/**
 * True undo of a claim: deletes the Claim row, reopens the Absence, and
 * clears the Token's usedAt (expiresAt is left untouched — releasing
 * doesn't grant extra time). Shared by the parent self-release action
 * (gated at a notice cutoff by its caller) and the staff override (no
 * cutoff) so both paths are guaranteed identical undo behavior.
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
        claimingFamily: { select: { name: true } },
        claimingChild: { select: { name: true } },
      },
    });

    await tx.absence.update({
      where: { id: claim.absenceId },
      data: { status: "OPEN" },
    });

    await tx.token.update({
      where: { id: claim.tokenId },
      data: { usedAt: null },
    });

    return claim;
  });
}
