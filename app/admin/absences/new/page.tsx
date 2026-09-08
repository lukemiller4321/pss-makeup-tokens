import Link from "next/link";
import { requireStaffFamily } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { LogAbsenceForm } from "./log-absence-form";
import { CreateFamilyForm } from "./create-family-form";
import {
  btnGhost,
  btnPrimary,
  card,
  mutedText,
  pageInner,
  pageTitle,
  pageWrapCentered,
  sectionTitle,
} from "@/lib/ui";

export default async function AdminNewAbsencePage({
  searchParams,
}: PageProps<"/admin/absences/new">) {
  await requireStaffFamily();

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const familyId = typeof params.familyId === "string" ? params.familyId : "";

  const selectedFamily = familyId
    ? await prisma.family.findUnique({
        where: { id: familyId },
        include: { children: true },
      })
    : null;

  const matches = q
    ? await prisma.family.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { children: true },
        take: 10,
      })
    : [];

  return (
    <div className={pageWrapCentered}>
      <div className={`w-full max-w-lg ${pageInner}`}>
        <div className="flex items-center justify-between">
          <h1 className={pageTitle}>Log an absence for a parent</h1>
          <Link href="/admin" className={btnGhost}>
            Back to dashboard
          </Link>
        </div>

        {selectedFamily ? (
          <div className={`flex flex-col gap-3 ${card}`}>
            <p className={mutedText}>
              Logging for <strong>{selectedFamily.name}</strong> (
              {selectedFamily.email})
            </p>
            <LogAbsenceForm
              familyId={selectedFamily.id}
              kids={selectedFamily.children}
            />
            <Link href="/admin/absences/new" className={btnGhost}>
              Choose a different family
            </Link>
          </div>
        ) : (
          <>
            <div className={`flex flex-col gap-3 ${card}`}>
              <h2 className={sectionTitle}>Find an existing family</h2>
              <form method="get" className="flex gap-2">
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Search by family name or email"
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
                <button type="submit" className={btnPrimary}>
                  Search
                </button>
              </form>

              {q && matches.length === 0 && (
                <p className={mutedText}>No matching family found.</p>
              )}

              {matches.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {matches.map((match) => (
                    <li
                      key={match.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      <span className="text-gray-900">
                        {match.name} ({match.email}) —{" "}
                        {match.children.length} kid
                        {match.children.length === 1 ? "" : "s"}
                      </span>
                      <Link
                        href={`/admin/absences/new?familyId=${match.id}`}
                        className={btnGhost}
                      >
                        Log absence
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={`flex flex-col gap-3 ${card}`}>
              <h2 className={sectionTitle}>Or create a new family</h2>
              <CreateFamilyForm />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
