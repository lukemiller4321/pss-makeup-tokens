import { AbsenceStatus, Prisma } from "@prisma/client";

export type EffectiveAbsenceStatus = "OPEN" | "CLAIMED" | "EXPIRED";

export const EFFECTIVE_ABSENCE_STATUSES: EffectiveAbsenceStatus[] = [
  "OPEN",
  "CLAIMED",
  "EXPIRED",
];

/**
 * "Expired" is computed live, not stored: an OPEN absence whose date/time
 * has already passed. Absence.status itself stays OPEN in the database so
 * the atomic claim transaction's `status: "OPEN"` guard keeps working right
 * up until an actual claim happens.
 */
export function getEffectiveAbsenceStatus(
  absence: { status: AbsenceStatus; date: Date },
  now: Date,
): EffectiveAbsenceStatus {
  if (absence.status === "OPEN" && absence.date < now) {
    return "EXPIRED";
  }

  return absence.status;
}

export function whereForEffectiveStatus(
  effectiveStatus: EffectiveAbsenceStatus,
  now: Date,
): Prisma.AbsenceWhereInput {
  switch (effectiveStatus) {
    case "OPEN":
      return { status: "OPEN", date: { gte: now } };
    case "EXPIRED":
      return {
        OR: [{ status: "OPEN", date: { lt: now } }, { status: "EXPIRED" }],
      };
    case "CLAIMED":
      return { status: "CLAIMED" };
  }
}

/** Absences a parent can actually browse and claim: OPEN and not yet past. */
export function openAndNotExpiredWhere(now: Date): Prisma.AbsenceWhereInput {
  return { status: "OPEN", date: { gte: now } };
}
