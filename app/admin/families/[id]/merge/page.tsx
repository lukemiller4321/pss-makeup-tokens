import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffFamily } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { MergeConfirmForm } from "./merge-confirm-form";
import {
  alertWarning,
  btnGhost,
  btnPrimary,
  card,
  mutedText,
  pageInner,
  pageTitle,
  pageWrapCentered,
} from "@/lib/ui";

export default async function MergeFamilyPage({
  params,
  searchParams,
}: PageProps<"/admin/families/[id]/merge">) {
  await requireStaffFamily();

  const { id } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const duplicateId =
    typeof sp.duplicateId === "string" ? sp.duplicateId : "";

  const keepFamily = await prisma.family.findUnique({ where: { id } });

  if (!keepFamily) {
    notFound();
  }

  const duplicateFamily = duplicateId
    ? await prisma.family.findUnique({
        where: { id: duplicateId },
        include: { children: true, absences: true, tokens: true, claims: true },
      })
    : null;

  const matches =
    q && !duplicateFamily
      ? await prisma.family.findMany({
          where: {
            id: { not: id },
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 10,
        })
      : [];

  return (
    <div className={pageWrapCentered}>
      <div className={`w-full max-w-lg ${pageInner}`}>
        <div className="flex items-center justify-between">
          <h1 className={pageTitle}>Merge into {keepFamily.name}</h1>
          <Link href={`/admin/families/${keepFamily.id}`} className={btnGhost}>
            Cancel
          </Link>
        </div>

        {duplicateFamily ? (
          <div className={`flex flex-col gap-4 ${card}`}>
            <div className={alertWarning}>
              <p>
                This will move everything from{" "}
                <strong>{duplicateFamily.name}</strong> (
                {duplicateFamily.email}) into{" "}
                <strong>{keepFamily.name}</strong> ({keepFamily.email}), then
                delete {duplicateFamily.name}.
              </p>
              <ul className="mt-2 list-disc pl-5">
                <li>{duplicateFamily.children.length} kid(s)</li>
                <li>{duplicateFamily.absences.length} absence posting(s)</li>
                <li>{duplicateFamily.tokens.length} token(s)</li>
                <li>{duplicateFamily.claims.length} claim(s) made</li>
              </ul>
              <p className="mt-2">This can&apos;t be undone.</p>
            </div>
            <MergeConfirmForm
              keepId={keepFamily.id}
              duplicateId={duplicateFamily.id}
            />
            <Link
              href={`/admin/families/${keepFamily.id}/merge`}
              className={btnGhost}
            >
              Choose a different family
            </Link>
          </div>
        ) : (
          <div className={`flex flex-col gap-4 ${card}`}>
            <form method="get" className="flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search for the duplicate family"
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
                      {match.name} ({match.email})
                    </span>
                    <Link
                      href={`/admin/families/${keepFamily.id}/merge?duplicateId=${match.id}`}
                      className={btnGhost}
                    >
                      Select
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
