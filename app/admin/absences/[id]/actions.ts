"use server";

import { redirect } from "next/navigation";
import { requireStaffFamily } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { combinePacificDateTime } from "@/lib/timezone";

export type EditAbsenceState = { error?: string };
export type DeleteAbsenceState = { error?: string };

export async function updateAbsence(
  _prevState: EditAbsenceState,
  formData: FormData,
): Promise<EditAbsenceState> {
  await requireStaffFamily();

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

  // Atomic guard against a race where the posting was claimed after this
  // edit page loaded — only OPEN postings are editable.
  const result = await prisma.absence.updateMany({
    where: { id, status: "OPEN" },
    data: { date: newDate },
  });

  if (result.count === 0) {
    return { error: "This posting is no longer OPEN and can't be edited." };
  }

  redirect("/admin?edited=1");
}

export async function deleteAbsence(
  _prevState: DeleteAbsenceState,
  formData: FormData,
): Promise<DeleteAbsenceState> {
  await requireStaffFamily();

  const id = String(formData.get("id") ?? "");

  // Same atomic guard as edit — never delete a posting that's been claimed
  // since this confirmation page loaded, since that would orphan its
  // Claim and Token records.
  const result = await prisma.absence.deleteMany({
    where: { id, status: "OPEN" },
  });

  if (result.count === 0) {
    return { error: "This posting is no longer OPEN and can't be deleted." };
  }

  redirect("/admin?deleted=1");
}
