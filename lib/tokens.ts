import { Prisma } from "@prisma/client";

export type TokenStatus =
  | "Available"
  | "Used"
  | "Revoked"
  | "Forfeited"
  | "Expired";

/**
 * Single source of truth for the 30-day expiry math, so manual staff
 * issuance and normal absence-report issuance can never drift apart.
 */
export function tokenCreateArgs(
  familyId: string,
  note?: string,
): Prisma.TokenUncheckedCreateInput {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt);
  expiresAt.setDate(expiresAt.getDate() + 30);

  return { familyId, issuedAt, expiresAt, note: note ?? null };
}

export function getTokenStatus(
  token: {
    usedAt: Date | null;
    revokedAt: Date | null;
    forfeitedAt: Date | null;
    expiresAt: Date;
  },
  now: Date,
): TokenStatus {
  if (token.revokedAt) {
    return "Revoked";
  }

  if (token.forfeitedAt) {
    return "Forfeited";
  }

  if (token.usedAt) {
    return "Used";
  }

  if (token.expiresAt < now) {
    return "Expired";
  }

  return "Available";
}

/** A token this family can actually spend right now. */
export function availableTokenWhere(now: Date): Prisma.TokenWhereInput {
  return { usedAt: null, revokedAt: null, expiresAt: { gt: now } };
}
