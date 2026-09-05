"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { getFamilyForUser } from "@/lib/family";
import { prisma } from "@/lib/prisma";

export type ClaimState = { error?: string };

class SlotAlreadyClaimedError extends Error {}
class NoTokenAvailableError extends Error {}

export async function claimAbsence(
  _prevState: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const family = await getFamilyForUser(user);

  if (!family) {
    redirect("/onboarding");
  }

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
        },
        data: { status: "CLAIMED" },
      });

      if (claimedAbsence.count === 0) {
        throw new SlotAlreadyClaimedError();
      }

      const token = await tx.token.findFirst({
        where: {
          familyId: family.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { expiresAt: "asc" },
      });

      if (!token) {
        throw new NoTokenAvailableError();
      }

      // Same compare-and-swap pattern, in case this family is claiming two
      // slots at once with only one spendable token between them.
      const usedToken = await tx.token.updateMany({
        where: { id: token.id, usedAt: null },
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
        include: { absence: { select: { date: true } } },
      });
    });

    claimedDate = claim.absence.date;
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

  redirect(`/?claimed=1&slotDate=${encodeURIComponent(claimedDate.toISOString())}`);
}
