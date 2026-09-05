import { prisma } from "@/lib/prisma";

/**
 * Creates an Absence and issues its Token in one transaction. Shared by the
 * parent-facing report form and staff manual entry so both paths are
 * guaranteed identical behavior — no special-cased staff logic.
 */
export async function createAbsenceWithToken(params: {
  familyId: string;
  childId: string;
  date: Date;
}) {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt);
  expiresAt.setDate(expiresAt.getDate() + 30);

  const [absence, token] = await prisma.$transaction([
    prisma.absence.create({
      data: {
        familyId: params.familyId,
        childId: params.childId,
        date: params.date,
        status: "OPEN",
      },
    }),
    prisma.token.create({
      data: {
        familyId: params.familyId,
        issuedAt,
        expiresAt,
      },
    }),
  ]);

  return { absence, token };
}
