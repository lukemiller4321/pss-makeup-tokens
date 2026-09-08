import Link from "next/link";
import { requireActiveFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { formatPacificDate, formatPacificTime } from "@/lib/timezone";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import {
  btnGhost,
  mutedText,
  pageInner,
  pageTitle,
  pageWrap,
  table,
  tableWrap,
  td,
  th,
  theadRow,
  tr,
} from "@/lib/ui";

const absenceStatusTone: Record<string, BadgeTone> = {
  OPEN: "green",
  CLAIMED: "gray",
  EXPIRED: "red",
};

export default async function AbsencesPage() {
  const family = await requireActiveFamily();

  const absences = await prisma.absence.findMany({
    where: { familyId: family.id },
    include: { child: true },
    orderBy: { date: "desc" },
  });

  return (
    <div className={pageWrap}>
      <div className={`w-full max-w-2xl ${pageInner}`}>
        <div className="flex items-center justify-between">
          <h1 className={pageTitle}>Your absences</h1>
          <Link href="/absences/new" className={btnGhost}>
            Report an absence
          </Link>
        </div>

        {absences.length === 0 ? (
          <p className={mutedText}>No absences reported yet.</p>
        ) : (
          <div className={tableWrap}>
            <table className={table}>
              <thead>
                <tr className={theadRow}>
                  <th className={th}>Kid</th>
                  <th className={th}>Date</th>
                  <th className={th}>Time (Pacific)</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {absences.map((absence) => (
                  <tr key={absence.id} className={tr}>
                    <td className={td}>{absence.child.name}</td>
                    <td className={td}>{formatPacificDate(absence.date)}</td>
                    <td className={td}>{formatPacificTime(absence.date)}</td>
                    <td className={td}>
                      <StatusBadge
                        label={absence.status}
                        tone={absenceStatusTone[absence.status] ?? "gray"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Link href="/" className={btnGhost}>
          Back home
        </Link>
      </div>
    </div>
  );
}
