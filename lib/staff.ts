import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFamilyForUser, type FamilyWithChildren } from "@/lib/family";

/**
 * Redirects to /sign-in, /onboarding, or / (for non-staff) as appropriate,
 * otherwise returns the signed-in staff family. Shared by every admin page
 * and server action so the role check can't drift between call sites.
 */
export async function requireStaffFamily(): Promise<FamilyWithChildren> {
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

  if (family.role !== "STAFF") {
    redirect("/");
  }

  return family;
}
