import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
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

/**
 * Redirects to /sign-in, /onboarding, or (if deactivated) back to /sign-in
 * signed out, as appropriate. Otherwise returns the signed-in, active
 * family. Shared by every parent-facing page and mutating server action so
 * a deactivated account is locked out everywhere, not just hidden from one
 * page.
 */
export async function requireActiveFamily(): Promise<FamilyWithChildren> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const family = await getFamilyForUser(user);

  if (!family) {
    redirect("/onboarding");
  }

  if (!family.active) {
    await supabase.auth.signOut();
    redirect(
      `/sign-in?error=${encodeURIComponent("This account has been deactivated.")}`,
    );
  }

  return family;
}
