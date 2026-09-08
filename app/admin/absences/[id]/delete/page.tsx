import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffFamily } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { formatPacificDate, formatPacificTime } from "@/lib/timezone";
import { DeleteAbsenceForm } from "./delete-absence-form";
import {
  alertError,
  btnGhost,
  card,
  mutedText,
  pageInner,
  pageTitle,
  pageWrapCentered,
} from "@/lib/ui";

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
    <div className={pageWrapCentered}>
      <div className={`w-full max-w-sm ${pageInner}`}>
        <div className="flex items-center justify-between">
          <h1 className={pageTitle}>Delete posting</h1>
          <Link href="/admin" className={btnGhost}>
            Back to dashboard
          </Link>
        </div>

        {absence.status !== "OPEN" ? (
          <div className={card}>
            <p className={mutedText}>
              This posting is {absence.status.toLowerCase()} and can only be
              deleted while it&apos;s open.
            </p>
          </div>
        ) : (
          <div className={`flex flex-col gap-4 ${card}`}>
            <div className={alertError}>
              <p>
                Delete the posting for <strong>{absence.family.name}</strong>{" "}
                — {absence.child.name} on {formatPacificDate(absence.date)} at{" "}
                {formatPacificTime(absence.date)} PT?
              </p>
              <p className="mt-1">This can&apos;t be undone.</p>
            </div>
            <DeleteAbsenceForm absenceId={absence.id} />
          </div>
        )}
      </div>
    </div>
  );
}
