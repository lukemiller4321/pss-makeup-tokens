import { prisma } from "@/lib/prisma";
import { tokenCreateArgs, availableTokenWhere } from "@/lib/tokens";
import {
  sendAbsenceReportedStaffEmail,
  sendNewSlotAvailableEmail,
} from "@/lib/email";
import { hoursBetween } from "@/lib/timezone";

export const MINIMUM_NOTICE_HOURS = 12;

/**
 * Rolling window, not calendar-month — matches how token expiry already
 * works (30 days from issuance, via plain Date math below, same as
 * tokenCreateArgs uses). A family can earn at most one token in any
 * trailing 30-day window.
 */
export const MONTHLY_TOKEN_CAP_DAYS = 30;

/** Why a reported absence didn't earn its poster a token. */
export type TokenWithheldReason = "TOO_SOON" | "MONTHLY_CAP";

/**
 * Creates an Absence, and issues its Token only if both:
 *  - reported with at least MINIMUM_NOTICE_HOURS notice before the
 *    absence's own date/time, and
 *  - this family hasn't already had a token issued in the trailing
 *    MONTHLY_TOKEN_CAP_DAYS days (counting any token's issuedAt
 *    regardless of whether it was later used, expired, or revoked).
 * An absence still gets posted and listed on Browse regardless of either
 * check, it just doesn't earn a token. Applies uniformly to every entry
 * point (parent-facing form and both admin call-in paths), no staff
 * bypass for either rule; a genuine exception goes through the manual
 * token issue tool instead. Also the single place that notifies staff by
 * email and broadcasts the new-slot notice to token holders, so every
 * entry point fires both without duplicating the calls.
 */
export async function createAbsenceWithToken(params: {
  familyId: string;
  childId: string;
  date: Date;
}) {
  const meetsNotice =
    hoursBetween(new Date(), params.date) >= MINIMUM_NOTICE_HOURS;

  let tokenIssued = false;
  let reason: TokenWithheldReason | undefined;

  if (!meetsNotice) {
    reason = "TOO_SOON";
  } else {
    const capWindowStart = new Date();
    capWindowStart.setDate(capWindowStart.getDate() - MONTHLY_TOKEN_CAP_DAYS);

    const recentTokenCount = await prisma.token.count({
      where: { familyId: params.familyId, issuedAt: { gte: capWindowStart } },
    });

    if (recentTokenCount > 0) {
      reason = "MONTHLY_CAP";
    } else {
      tokenIssued = true;
    }
  }

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

  // Notify every family currently holding an available token (except the
  // one that just posted) that a new slot opened — fires regardless of
  // whether this report itself earned a token. One email per family, each
  // isolated so a single bad send never blocks the rest from going out.
  try {
    const tokenHolders = await prisma.family.findMany({
      where: {
        id: { not: params.familyId },
        active: true,
        tokens: { some: availableTokenWhere(new Date()) },
      },
      select: { id: true, email: true },
    });

    for (const holder of tokenHolders) {
      try {
        await sendNewSlotAvailableEmail({
          to: holder.email,
          absenceDate: absence.date,
        });
      } catch (err) {
        console.error(
          `Failed to send new-slot-available email to ${holder.email}:`,
          err,
        );
      }
    }
  } catch (err) {
    console.error(
      "Failed to look up token holders for new-slot-available email:",
      err,
    );
  }

  return { absence, token, tokenIssued, reason };
}
