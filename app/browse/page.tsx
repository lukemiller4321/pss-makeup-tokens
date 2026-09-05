import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFamilyForUser } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { openAndNotExpiredWhere } from "@/lib/absence-status";
import { AbsenceListing } from "./absence-listing";

export default async function BrowsePage() {
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

  const now = new Date();

  const [openAbsences, activeTokenCount] = await Promise.all([
    prisma.absence.findMany({
      where: { ...openAndNotExpiredWhere(now), familyId: { not: family.id } },
      orderBy: { date: "asc" },
      select: { id: true, date: true },
    }),
    prisma.token.count({
      where: {
        familyId: family.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    }),
  ]);

  const hasToken = activeTokenCount > 0;

  return (
    <div className="flex flex-1 flex-col items-center p-8">
      <div className="flex w-full max-w-lg flex-col gap-4">
        <h1 className="text-xl font-semibold">Open absences</h1>

        {!hasToken && (
          <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            You don&apos;t have any makeup tokens available.
          </div>
        )}

        {openAbsences.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            No open absences right now.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {openAbsences.map((absence) => (
              <AbsenceListing
                key={absence.id}
                absenceId={absence.id}
                date={absence.date.toISOString()}
                kids={family.children}
                canClaim={hasToken}
              />
            ))}
          </ul>
        )}

        <Link href="/" className="text-sm underline">
          Back home
        </Link>
      </div>
    </div>
  );
}
