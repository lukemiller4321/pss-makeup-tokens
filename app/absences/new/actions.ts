"use server";

import { redirect } from "next/navigation";
import { requireActiveFamily } from "@/lib/family";
import { combinePacificDateTime } from "@/lib/timezone";
import { createAbsenceWithToken } from "@/lib/report-absence";

export type ReportAbsenceState = { error?: string };

export async function reportAbsence(
  _prevState: ReportAbsenceState,
  formData: FormData,
): Promise<ReportAbsenceState> {
  const family = await requireActiveFamily();

  const childId = String(formData.get("childId") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");

  const child = family.children.find((kid) => kid.id === childId);

  if (!child) {
    return { error: "Select a valid kid." };
  }

  if (!date || !time) {
    return { error: "Date and time are required." };
  }

  const absenceDate = combinePacificDateTime(date, time);

  if (!absenceDate) {
    return { error: "Enter a valid date and time." };
  }

  const { token, tokenIssued, reason } = await createAbsenceWithToken({
    familyId: family.id,
    childId: child.id,
    date: absenceDate,
  });

  if (tokenIssued && token) {
    redirect(
      `/?reported=1&tokenIssued=1&tokenExpires=${encodeURIComponent(token.expiresAt.toISOString())}`,
    );
  }

  redirect(
    `/?reported=1&tokenIssued=0${reason ? `&reason=${reason}` : ""}`,
  );
}
