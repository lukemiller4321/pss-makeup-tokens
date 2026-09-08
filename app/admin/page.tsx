import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaffFamily } from "@/lib/staff";
import { formatPacificDate, formatPacificTime } from "@/lib/timezone";
import {
  EFFECTIVE_ABSENCE_STATUSES,
  getEffectiveAbsenceStatus,
  whereForEffectiveStatus,
  type EffectiveAbsenceStatus,
} from "@/lib/absence-status";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { MINIMUM_NOTICE_HOURS } from "@/lib/report-absence";
import { ReleaseClaimForm } from "./release-claim-form";
import {
  alertSuccess,
  btnGhostDestructiveSm,
  btnGhostSm,
  btnPrimary,
  btnSecondary,
  fieldGroup,
  inputBase,
  labelBase,
  mutedText,
  pageInner,
  pageTitle,
  table,
  tableWrap,
  td,
  th,
  theadRow,
  tr,
  pageWrap,
} from "@/lib/ui";

const absenceStatusTones: Record<EffectiveAbsenceStatus, BadgeTone> = {
  OPEN: "green",
  CLAIMED: "gray",
  EXPIRED: "red",
};

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;

  await requireStaffFamily();

  const statusParam = typeof params.status === "string" ? params.status : "";
  const status = EFFECTIVE_ABSENCE_STATUSES.find((s) => s === statusParam);
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const now = new Date();

  const logged = params.logged === "1";
  const tokenIssuedParam = params.tokenIssued === "1";

  const where: Prisma.AbsenceWhereInput = status
    ? whereForEffectiveStatus(status, now)
    : {};

  if (q) {
    where.family = { name: { contains: q, mode: "insensitive" } };
  }

  const absences = await prisma.absence.findMany({
    where,
    include: {
      family: { select: { name: true } },
      child: { select: { name: true } },
      claim: {
        select: {
          id: true,
          claimingFamily: { select: { name: true } },
          claimingChild: { select: { name: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className={pageWrap}>
      <div className={`w-full max-w-4xl ${pageInner}`}>
        {logged && (
          <div className={alertSuccess}>
            {tokenIssuedParam ? (
              <p>Absence logged and a makeup token was issued.</p>
            ) : (
              <p>
                Absence logged. This was within {MINIMUM_NOTICE_HOURS / 24}{" "}
                days of the lesson, so no makeup token was issued.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <h1 className={pageTitle}>Absence postings</h1>
          <div className="flex gap-2">
            <Link href="/admin/families" className={btnSecondary}>
              Families
            </Link>
            <Link href="/admin/absences/new" className={btnPrimary}>
              Log an absence for a parent
            </Link>
          </div>
        </div>

        <form method="get" className="flex flex-wrap items-end gap-2">
          <div className={fieldGroup}>
            <label htmlFor="status" className={labelBase}>
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status ?? ""}
              className={inputBase}
            >
              <option value="">All</option>
              {EFFECTIVE_ABSENCE_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className={fieldGroup}>
            <label htmlFor="q" className={labelBase}>
              Family name
            </label>
            <input
              id="q"
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by family name"
              className={inputBase}
            />
          </div>

          <button type="submit" className={btnPrimary}>
            Apply
          </button>
        </form>

        {absences.length === 0 ? (
          <p className={mutedText}>No postings match these filters.</p>
        ) : (
          <div className={tableWrap}>
            <table className={table}>
              <thead>
                <tr className={theadRow}>
                  <th className={th}>Family</th>
                  <th className={th}>Kid</th>
                  <th className={th}>Date</th>
                  <th className={th}>Time (Pacific)</th>
                  <th className={th}>Status</th>
                  <th className={th}>Claimed by</th>
                  <th className={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {absences.map((absence) => {
                  const effectiveStatus: EffectiveAbsenceStatus =
                    getEffectiveAbsenceStatus(absence, now);
                  const canEdit = absence.status === "OPEN";

                  return (
                    <tr key={absence.id} className={tr}>
                      <td className={td}>{absence.family.name}</td>
                      <td className={td}>{absence.child.name}</td>
                      <td className={td}>{formatPacificDate(absence.date)}</td>
                      <td className={td}>{formatPacificTime(absence.date)}</td>
                      <td className={td}>
                        <StatusBadge
                          label={effectiveStatus}
                          tone={absenceStatusTones[effectiveStatus]}
                        />
                      </td>
                      <td className={td}>
                        {absence.claim
                          ? `${absence.claim.claimingFamily.name} — ${absence.claim.claimingChild.name}`
                          : "—"}
                      </td>
                      <td className={td}>
                        {canEdit ? (
                          <span className="flex gap-3">
                            <Link
                              href={`/admin/absences/${absence.id}/edit`}
                              className={btnGhostSm}
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/admin/absences/${absence.id}/delete`}
                              className={btnGhostDestructiveSm}
                            >
                              Delete
                            </Link>
                          </span>
                        ) : absence.status === "CLAIMED" && absence.claim ? (
                          <ReleaseClaimForm claimId={absence.claim.id} />
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
