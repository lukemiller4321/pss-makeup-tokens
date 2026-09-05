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

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;

  await requireStaffFamily();

  const statusParam = typeof params.status === "string" ? params.status : "";
  const status = EFFECTIVE_ABSENCE_STATUSES.find((s) => s === statusParam);
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const now = new Date();

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
          claimingFamily: { select: { name: true } },
          claimingChild: { select: { name: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col items-center p-8">
      <div className="flex w-full max-w-4xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin — Absence postings</h1>
          <Link
            href="/admin/absences/new"
            className="rounded bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            Log an absence for a parent
          </Link>
        </div>

        <form method="get" className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Status
            </span>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
            >
              <option value="">All</option>
              {EFFECTIVE_ABSENCE_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Family name
            </span>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by family name"
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
            />
          </label>

          <button
            type="submit"
            className="rounded bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            Apply
          </button>
        </form>

        {absences.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            No postings match these filters.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-300 dark:border-zinc-700">
                <th className="py-2">Family</th>
                <th className="py-2">Kid</th>
                <th className="py-2">Date</th>
                <th className="py-2">Time (Pacific)</th>
                <th className="py-2">Status</th>
                <th className="py-2">Claimed by</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {absences.map((absence) => {
                const effectiveStatus: EffectiveAbsenceStatus =
                  getEffectiveAbsenceStatus(absence, now);
                const canEdit = absence.status === "OPEN";

                return (
                  <tr
                    key={absence.id}
                    className="border-b border-zinc-200 dark:border-zinc-800"
                  >
                    <td className="py-2">{absence.family.name}</td>
                    <td className="py-2">{absence.child.name}</td>
                    <td className="py-2">{formatPacificDate(absence.date)}</td>
                    <td className="py-2">{formatPacificTime(absence.date)}</td>
                    <td className="py-2">{effectiveStatus}</td>
                    <td className="py-2">
                      {absence.claim
                        ? `${absence.claim.claimingFamily.name} — ${absence.claim.claimingChild.name}`
                        : "—"}
                    </td>
                    <td className="py-2">
                      {canEdit ? (
                        <span className="flex gap-2">
                          <Link
                            href={`/admin/absences/${absence.id}/edit`}
                            className="underline"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/admin/absences/${absence.id}/delete`}
                            className="underline"
                          >
                            Delete
                          </Link>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
