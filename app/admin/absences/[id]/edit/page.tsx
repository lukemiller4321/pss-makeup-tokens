import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffFamily } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import {
  toPacificDateInputValue,
  toPacificTimeInputValue,
} from "@/lib/timezone";
import { EditAbsenceForm } from "./edit-absence-form";
import {
  btnGhost,
  card,
  mutedText,
  pageInner,
  pageTitle,
  pageWrapCentered,
} from "@/lib/ui";

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
    <div className={pageWrapCentered}>
      <div className={`w-full max-w-sm ${pageInner}`}>
        <div className="flex items-center justify-between">
          <h1 className={pageTitle}>Edit posting</h1>
          <Link href="/admin" className={btnGhost}>
            Back to dashboard
          </Link>
        </div>

        <div className={card}>
          <p className={mutedText}>
            {absence.family.name} — {absence.child.name}
          </p>

          {absence.status !== "OPEN" ? (
            <p className={`mt-3 ${mutedText}`}>
              This posting is {absence.status.toLowerCase()} and can only be
              edited while it&apos;s open.
            </p>
          ) : (
            <div className="mt-4">
              <EditAbsenceForm
                absenceId={absence.id}
                defaultDate={toPacificDateInputValue(absence.date)}
                defaultTime={toPacificTimeInputValue(absence.date)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
