import { prisma } from "@/lib/prisma";
import { tokenCreateArgs } from "@/lib/tokens";
import { sendAbsenceReportedStaffEmail } from "@/lib/email";
import { hoursBetween } from "@/lib/timezone";

export const MINIMUM_NOTICE_HOURS = 72;

/**
 * Creates an Absence, and issues its Token only if reported with at least
 * MINIMUM_NOTICE_HOURS notice before the absence's own date/time — an
 * absence still gets posted and listed on Browse regardless of notice, it
 * just doesn't earn a token on short notice. Applies uniformly to every
 * entry point (parent-facing form and both admin call-in paths), no staff
 * bypass; a genuine short-notice exception goes through the manual token
 * issue tool instead. Also the single place that notifies staff by email,
 * so every entry point fires it without duplicating the call.
 */
export async function createAbsenceWithToken(params: {
  familyId: string;
  childId: string;
  date: Date;
}) {
  const tokenIssued =
    hoursBetween(new Date(), params.date) >= MINIMUM_NOTICE_HOURS;

  const absenceData = {
    familyId: params.familyId,
    childId: params.childId,
    date: params.date,
    status: "OPEN" as const,
  };
  const absenceInclude = {
    family: { select: { name: true } },
    child: { select: { name: true } },
  };

  let absence;
  let token = null;

  if (tokenIssued) {
    [absence, token] = await prisma.$transaction([
      prisma.absence.create({ data: absenceData, include: absenceInclude }),
      prisma.token.create({ data: tokenCreateArgs(params.familyId) }),
    ]);
  } else {
    absence = await prisma.absence.create({
      data: absenceData,
      include: absenceInclude,
    });
  }

  // Best-effort — a failed staff notification must never affect the
  // absence/token that already committed.
  try {
    await sendAbsenceReportedStaffEmail({
      familyName: absence.family.name,
      childName: absence.child.name,
      absenceDate: absence.date,
    });
  } catch (err) {
    console.error("Failed to send absence-reported staff email:", err);
  }

  return { absence, token, tokenIssued };
}
