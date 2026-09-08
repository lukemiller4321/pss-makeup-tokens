import Link from "next/link";
import { requireActiveFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { openAndNotExpiredWhere } from "@/lib/absence-status";
import { availableTokenWhere } from "@/lib/tokens";
import { AbsenceListing } from "./absence-listing";
import {
  alertWarning,
  btnGhost,
  mutedText,
  pageInner,
  pageTitle,
  pageWrap,
} from "@/lib/ui";

export default async function BrowsePage() {
  const family = await requireActiveFamily();

  const now = new Date();

  const [openAbsences, activeTokenCount] = await Promise.all([
    prisma.absence.findMany({
      where: {
        ...openAndNotExpiredWhere(now),
        familyId: { not: family.id },
        family: { active: true },
      },
      orderBy: { date: "asc" },
      select: { id: true, date: true },
    }),
    prisma.token.count({
      where: { familyId: family.id, ...availableTokenWhere(now) },
    }),
  ]);

  const hasToken = activeTokenCount > 0;

  return (
    <div className={pageWrap}>
      <div className={`w-full max-w-lg ${pageInner}`}>
        <h1 className={pageTitle}>Open absences</h1>

        {!hasToken && (
          <div className={alertWarning}>
            You don&apos;t have any makeup tokens available.
          </div>
        )}

        {openAbsences.length === 0 ? (
          <p className={mutedText}>No open absences right now.</p>
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

        <Link href="/" className={btnGhost}>
          Back home
        </Link>
      </div>
    </div>
  );
}
