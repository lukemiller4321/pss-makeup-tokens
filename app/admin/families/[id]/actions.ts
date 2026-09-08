"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaffFamily } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { tokenCreateArgs } from "@/lib/tokens";
import { logAuditEvent } from "@/lib/audit-log";

export type FamilyActionState = { error?: string };

class TokenNotAvailableError extends Error {}

export async function issueToken(
  _prevState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const staffFamily = await requireStaffFamily();

  const familyId = String(formData.get("familyId") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!note) {
    return { error: "A reason/note is required for a manually issued token." };
  }

  const family = await prisma.family.findUnique({ where: { id: familyId } });

  if (!family) {
    return { error: "Family not found." };
  }

  await prisma.$transaction(async (tx) => {
    const token = await tx.token.create({ data: tokenCreateArgs(familyId, note) });

    await logAuditEvent(tx, {
      staffFamilyId: staffFamily.id,
      action: "issue_token",
      targetType: "Family",
      targetId: familyId,
      details: `Issued token ${token.id} (expires ${token.expiresAt.toISOString()}). Note: ${note}`,
    });
  });

  revalidatePath(`/admin/families/${familyId}`);

  return {};
}

export async function revokeToken(
  _prevState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const staffFamily = await requireStaffFamily();

  const tokenId = String(formData.get("tokenId") ?? "");
  const familyId = String(formData.get("familyId") ?? "");

  try {
    await prisma.$transaction(async (tx) => {
      // Atomic guard: only revoke a token that's still genuinely available —
      // never trust the client, and never race with a claim spending it or
      // a second revoke on the same token.
      const result = await tx.token.updateMany({
        where: { id: tokenId, familyId, usedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      if (result.count === 0) {
        throw new TokenNotAvailableError();
      }

      await logAuditEvent(tx, {
        staffFamilyId: staffFamily.id,
        action: "revoke_token",
        targetType: "Family",
        targetId: familyId,
        details: `Revoked token ${tokenId}`,
      });
    });
  } catch (err) {
    if (err instanceof TokenNotAvailableError) {
      return {
        error: "This token is no longer available and can't be revoked.",
      };
    }

    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath(`/admin/families/${familyId}`);

  return {};
}

export async function toggleActive(
  _prevState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const staffFamily = await requireStaffFamily();

  const familyId = String(formData.get("familyId") ?? "");
  const nextActive = formData.get("nextActive") === "true";

  const family = await prisma.family.findUnique({ where: { id: familyId } });

  if (!family) {
    return { error: "Family not found." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.family.update({
      where: { id: familyId },
      data: { active: nextActive },
    });

    await logAuditEvent(tx, {
      staffFamilyId: staffFamily.id,
      action: nextActive ? "reactivate" : "deactivate",
      targetType: "Family",
      targetId: familyId,
    });
  });

  revalidatePath(`/admin/families/${familyId}`);
  revalidatePath("/admin/families");

  return {};
}

export async function mergeFamilies(
  _prevState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const staffFamily = await requireStaffFamily();

  const keepId = String(formData.get("keepId") ?? "");
  const duplicateId = String(formData.get("duplicateId") ?? "");

  if (!keepId || !duplicateId || keepId === duplicateId) {
    return { error: "Select a different family to merge as the duplicate." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const duplicate = await tx.family.findUnique({
        where: { id: duplicateId },
        include: {
          children: true,
          absences: true,
          tokens: true,
          claims: true,
        },
      });

      if (!duplicate) {
        throw new Error("Duplicate family not found.");
      }

      const movedCounts = {
        children: duplicate.children.length,
        absences: duplicate.absences.length,
        tokens: duplicate.tokens.length,
        claims: duplicate.claims.length,
      };

      await tx.child.updateMany({
        where: { familyId: duplicateId },
        data: { familyId: keepId },
      });
      await tx.absence.updateMany({
        where: { familyId: duplicateId },
        data: { familyId: keepId },
      });
      await tx.token.updateMany({
        where: { familyId: duplicateId },
        data: { familyId: keepId },
      });
      await tx.claim.updateMany({
        where: { claimingFamilyId: duplicateId },
        data: { claimingFamilyId: keepId },
      });

      // Confirm nothing was left behind before deleting — refuse to
      // silently drop data if any reassignment didn't fully land.
      const remaining = await tx.family.findUnique({
        where: { id: duplicateId },
        include: {
          children: true,
          absences: true,
          tokens: true,
          claims: true,
        },
      });

      if (
        !remaining ||
        remaining.children.length > 0 ||
        remaining.absences.length > 0 ||
        remaining.tokens.length > 0 ||
        remaining.claims.length > 0
      ) {
        throw new Error(
          "Merge incomplete — refusing to delete the duplicate family with data still attached.",
        );
      }

      await tx.family.delete({ where: { id: duplicateId } });

      await logAuditEvent(tx, {
        staffFamilyId: staffFamily.id,
        action: "merge_family",
        targetType: "Family",
        targetId: keepId,
        details: `Merged in ${duplicate.name} (${duplicate.email}): ${movedCounts.children} kid(s), ${movedCounts.absences} absence(s), ${movedCounts.tokens} token(s), ${movedCounts.claims} claim(s).`,
      });
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Merge failed.",
    };
  }

  revalidatePath(`/admin/families/${keepId}`);
  revalidatePath("/admin/families");
  redirect(`/admin/families/${keepId}`);
}
