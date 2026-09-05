import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFamilyForUser } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { formatPacificDate, formatPacificTime } from "@/lib/timezone";

export default async function AbsencesPage() {
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

  const absences = await prisma.absence.findMany({
    where: { familyId: family.id },
    include: { child: true },
    orderBy: { date: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col items-center p-8">
      <div className="flex w-full max-w-lg flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Your absences</h1>
          <Link href="/absences/new" className="text-sm underline">
            Report an absence
          </Link>
        </div>

        {absences.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            No absences reported yet.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-300 dark:border-zinc-700">
                <th className="py-2">Kid</th>
                <th className="py-2">Date</th>
                <th className="py-2">Time (Pacific)</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {absences.map((absence) => (
                <tr
                  key={absence.id}
                  className="border-b border-zinc-200 dark:border-zinc-800"
                >
                  <td className="py-2">{absence.child.name}</td>
                  <td className="py-2">{formatPacificDate(absence.date)}</td>
                  <td className="py-2">{formatPacificTime(absence.date)}</td>
                  <td className="py-2">{absence.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Link href="/" className="text-sm underline">
          Back home
        </Link>
      </div>
    </div>
  );
}
