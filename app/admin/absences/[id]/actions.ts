"use server";

import { redirect } from "next/navigation";
import { requireStaffFamily } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { combinePacificDateTime } from "@/lib/timezone";
import { logAuditEvent } from "@/lib/audit-log";

export type EditAbsenceState = { error?: string };
export type DeleteAbsenceState = { error?: string };

class AbsenceNotOpenError extends Error {}

export async function updateAbsence(
  _prevState: EditAbsenceState,
  formData: FormData,
): Promise<EditAbsenceState> {
  const staffFamily = await requireStaffFamily();

  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");

  if (!date || !time) {
    return { error: "Date and time are required." };
  }

  const newDate = combinePacificDateTime(date, time);

  if (!newDate) {
    return { error: "Enter a valid date and time." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.absence.findUnique({ where: { id } });

      // Atomic guard against a race where the posting was claimed after
      // this edit page loaded — only OPEN postings are editable.
      const result = await tx.absence.updateMany({
        where: { id, status: "OPEN" },
        data: { date: newDate },
      });

      if (!existing || result.count === 0) {
        throw new AbsenceNotOpenError();
      }

      await logAuditEvent(tx, {
        staffFamilyId: staffFamily.id,
        action: "edit_absence",
        targetType: "Family",
        targetId: existing.familyId,
        details: `Absence ${id} moved from ${existing.date.toISOString()} to ${newDate.toISOString()}`,
      });
    });
  } catch (err) {
    if (err instanceof AbsenceNotOpenError) {
      return { error: "This posting is no longer OPEN and can't be edited." };
    }

    return { error: "Something went wrong. Please try again." };
  }

  redirect("/admin?edited=1");
}

export async function deleteAbsence(
  _prevState: DeleteAbsenceState,
  formData: FormData,
): Promise<DeleteAbsenceState> {
  const staffFamily = await requireStaffFamily();

  const id = String(formData.get("id") ?? "");

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.absence.findUnique({
        where: { id },
        include: { child: { select: { name: true } } },
      });

      // Same atomic guard as edit — never delete a posting that's been
      // claimed since this confirmation page loaded, since that would
      // orphan its Claim and Token records.
      const result = await tx.absence.deleteMany({
        where: { id, status: "OPEN" },
      });

      if (!existing || result.count === 0) {
        throw new AbsenceNotOpenError();
      }

      await logAuditEvent(tx, {
        staffFamilyId: staffFamily.id,
        action: "delete_absence",
        targetType: "Family",
        targetId: existing.familyId,
        details: `Deleted absence for ${existing.child.name} on ${existing.date.toISOString()}`,
      });
    });
  } catch (err) {
    if (err instanceof AbsenceNotOpenError) {
      return { error: "This posting is no longer OPEN and can't be deleted." };
    }

    return { error: "Something went wrong. Please try again." };
  }

  redirect("/admin?deleted=1");
}
