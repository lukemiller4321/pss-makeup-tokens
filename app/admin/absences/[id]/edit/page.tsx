import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffFamily } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import {
  toPacificDateInputValue,
  toPacificTimeInputValue,
} from "@/lib/timezone";
import { EditAbsenceForm } from "./edit-absence-form";

export default async function EditAbsencePage({
  params,
}: PageProps<"/admin/absences/[id]/edit">) {
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
          <h1 className="text-xl font-semibold">Edit posting</h1>
          <Link href="/admin" className="text-sm underline">
            Back to dashboard
          </Link>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {absence.family.name} — {absence.child.name}
        </p>

        {absence.status !== "OPEN" ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This posting is {absence.status.toLowerCase()} and can only be
            edited while it&apos;s open.
          </p>
        ) : (
          <EditAbsenceForm
            absenceId={absence.id}
            defaultDate={toPacificDateInputValue(absence.date)}
            defaultTime={toPacificTimeInputValue(absence.date)}
          />
        )}
      </div>
    </div>
  );
}
