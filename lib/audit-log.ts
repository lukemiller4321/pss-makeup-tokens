import type { Prisma, PrismaClient } from "@prisma/client";

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

/**
 * targetType/targetId always identify the Family an action affected — see
 * the schema comment on AuditLog. Every staff mutation writes one of these
 * in the same transaction as the mutation itself, so the log is never out
 * of sync with what actually happened.
 */
export async function logAuditEvent(
  client: PrismaClientOrTx,
  event: {
    staffFamilyId: string;
    action: string;
    targetType: string;
    targetId: string;
    details?: string | null;
  },
) {
  await client.auditLog.create({
    data: {
      staffFamilyId: event.staffFamilyId,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      details: event.details ?? null,
    },
  });
}
