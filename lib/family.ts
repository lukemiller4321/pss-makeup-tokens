import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import type { Family, Child } from "@prisma/client";

export type FamilyWithChildren = Family & { children: Child[] };

export async function getFamilyForUser(
  user: Pick<User, "email">,
): Promise<FamilyWithChildren | null> {
  if (!user.email) {
    return null;
  }

  return prisma.family.findUnique({
    where: { email: user.email },
    include: { children: true },
  });
}
