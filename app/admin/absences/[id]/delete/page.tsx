import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffFamily } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { formatPacificDate, formatPacificTime } from "@/lib/timezone";
import { DeleteAbsenceForm } from "./delete-absence-form";

export default async function DeleteAbsencePage({
  params,
}: PageProps<"/admin/absences/[id]/delete">) {
  await requireStaffFamily();

  const { id } = await params;

  const absence = await prisma.absence.findUnique({
    where: { id },
    include: {
      family: { select: { name: true } },
      child: { select: { name: true } },
    },
  });

  if (!absence) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col items-center p-8">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Delete posting</h1>
          <Link href="/admin" className="text-sm underline">
            Back to dashboard
          </Link>
        </div>

        {absence.status !== "OPEN" ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This posting is {absence.status.toLowerCase()} and can only be
            deleted while it&apos;s open.
          </p>
        ) : (
          <>
            <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              <p>
                Delete the posting for <strong>{absence.family.name}</strong>{" "}
                — {absence.child.name} on {formatPacificDate(absence.date)} at{" "}
                {formatPacificTime(absence.date)} PT?
              </p>
              <p>This can&apos;t be undone.</p>
            </div>
            <DeleteAbsenceForm absenceId={absence.id} />
          </>
        )}
      </div>
    </div>
  );
}
