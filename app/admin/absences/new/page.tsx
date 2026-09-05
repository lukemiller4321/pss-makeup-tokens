import Link from "next/link";
import { requireStaffFamily } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { LogAbsenceForm } from "./log-absence-form";
import { CreateFamilyForm } from "./create-family-form";

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
    <div className="flex flex-1 flex-col items-center p-8">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Log an absence for a parent</h1>
          <Link href="/admin" className="text-sm underline">
            Back to dashboard
          </Link>
        </div>

        {selectedFamily ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Logging for <strong>{selectedFamily.name}</strong> (
              {selectedFamily.email})
            </p>
            <LogAbsenceForm
              familyId={selectedFamily.id}
              kids={selectedFamily.children}
            />
            <Link href="/admin/absences/new" className="text-sm underline">
              Choose a different family
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-medium">Find an existing family</h2>
              <form method="get" className="flex gap-2">
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Search by family name or email"
                  className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
                />
                <button
                  type="submit"
                  className="rounded bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
                >
                  Search
                </button>
              </form>

              {q && matches.length === 0 && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No matching family found.
                </p>
              )}

              {matches.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {matches.map((match) => (
                    <li
                      key={match.id}
                      className="flex items-center justify-between rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
                    >
                      <span>
                        {match.name} ({match.email}) —{" "}
                        {match.children.length} kid
                        {match.children.length === 1 ? "" : "s"}
                      </span>
                      <Link
                        href={`/admin/absences/new?familyId=${match.id}`}
                        className="underline"
                      >
                        Log absence
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-zinc-300 pt-4 dark:border-zinc-700">
              <h2 className="text-sm font-medium">
                Or create a new family
              </h2>
              <CreateFamilyForm />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
