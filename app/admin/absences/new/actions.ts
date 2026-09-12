"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireStaffFamily } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { combinePacificDateTime } from "@/lib/timezone";
import { createAbsenceWithToken } from "@/lib/report-absence";

export type LogAbsenceState = { error?: string };

function parseDateTime(formData: FormData): Date | { error: string } {
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");

  if (!date || !time) {
    return { error: "Date and time are required." };
  }

  const combined = combinePacificDateTime(date, time);

  if (!combined) {
    return { error: "Enter a valid date and time." };
  }

  return combined;
}

export async function logAbsenceForExistingFamily(
  _prevState: LogAbsenceState,
  formData: FormData,
): Promise<LogAbsenceState> {
  await requireStaffFamily();

  const familyId = String(formData.get("familyId") ?? "");
  const childId = String(formData.get("childId") ?? "");

  // Never trust the client — re-verify the kid actually belongs to the
  // family this form was rendered for.
  const child = await prisma.child.findFirst({
    where: { id: childId, familyId },
  });

  if (!child) {
    return { error: "Select a valid kid for this family." };
  }

  const absenceDate = parseDateTime(formData);

  if (!(absenceDate instanceof Date)) {
    return absenceDate;
  }

  const { tokenIssued, reason } = await createAbsenceWithToken({
    familyId,
    childId: child.id,
    date: absenceDate,
  });

  redirect(
    `/admin?logged=1&tokenIssued=${tokenIssued ? "1" : "0"}${reason ? `&reason=${reason}` : ""}`,
  );
}

export async function createFamilyAndLogAbsence(
  _prevState: LogAbsenceState,
  formData: FormData,
): Promise<LogAbsenceState> {
  await requireStaffFamily();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const familyName = String(formData.get("familyName") ?? "").trim();
  const kidName = String(formData.get("kidName") ?? "").trim();

  if (!email || !familyName || !kidName) {
    return { error: "Email, family name, and kid name are required." };
  }

  const absenceDate = parseDateTime(formData);

  if (!(absenceDate instanceof Date)) {
    return absenceDate;
  }

  let family;

  try {
    family = await prisma.family.create({
      data: {
        email,
        name: familyName,
        children: { create: [{ name: kidName }] },
      },
      include: { children: true },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        error: "A family with this email already exists — search for them instead.",
      };
    }

    return { error: "Something went wrong creating the family." };
  }

  const { tokenIssued, reason } = await createAbsenceWithToken({
    familyId: family.id,
    childId: family.children[0].id,
    date: absenceDate,
  });

  redirect(
    `/admin?logged=1&tokenIssued=${tokenIssued ? "1" : "0"}${reason ? `&reason=${reason}` : ""}`,
  );
}
