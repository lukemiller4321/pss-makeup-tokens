import { redirect } from "next/navigation";
import { requireActiveFamily, type FamilyWithChildren } from "@/lib/family";

/**
 * Same active-account gate as requireActiveFamily, plus a role check.
 * Shared by every admin page and server action so the role check can't
 * drift between call sites.
 */
export async function requireStaffFamily(): Promise<FamilyWithChildren> {
  const family = await requireActiveFamily();

  if (family.role !== "STAFF") {
    redirect("/");
  }

  return family;
}
