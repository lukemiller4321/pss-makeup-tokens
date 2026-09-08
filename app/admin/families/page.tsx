import Link from "next/link";
import { Prisma } from "@prisma/client";
import { requireStaffFamily } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { getTokenStatus } from "@/lib/tokens";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  btnGhost,
  btnPrimary,
  fieldGroup,
  inputBase,
  labelBase,
  mutedText,
  pageInner,
  pageTitle,
  pageWrap,
  table,
  tableWrap,
  td,
  th,
  theadRow,
  tr,
} from "@/lib/ui";

type StatusFilter = "active" | "deactivated" | "all";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "deactivated", label: "Deactivated" },
  { value: "all", label: "All" },
];

export default async function AdminFamiliesPage({
  searchParams,
}: PageProps<"/admin/families">) {
  await requireStaffFamily();

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const statusParam = typeof params.status === "string" ? params.status : "";
  const status: StatusFilter = STATUS_OPTIONS.some(
    (option) => option.value === statusParam,
  )
    ? (statusParam as StatusFilter)
    : "active";

  const where: Prisma.FamilyWhereInput = {};

  if (status === "active") {
    where.active = true;
  } else if (status === "deactivated") {
    where.active = false;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const families = await prisma.family.findMany({
    where,
    include: { children: true, tokens: true },
    orderBy: { name: "asc" },
  });

  const now = new Date();

  return (
    <div className={pageWrap}>
      <div className={`w-full max-w-4xl ${pageInner}`}>
        <div className="flex items-center justify-between">
          <h1 className={pageTitle}>Families</h1>
          <Link href="/admin" className={btnGhost}>
            Back to postings
          </Link>
        </div>

        <form method="get" className="flex flex-wrap items-end gap-2">
          <div className={fieldGroup}>
            <label htmlFor="status" className={labelBase}>
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status}
              className={inputBase}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={fieldGroup}>
            <label htmlFor="q" className={labelBase}>
              Name or email
            </label>
            <input
              id="q"
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by name or email"
              className={inputBase}
            />
          </div>

          <button type="submit" className={btnPrimary}>
            Apply
          </button>
        </form>

        {families.length === 0 ? (
          <p className={mutedText}>No families match these filters.</p>
        ) : (
          <div className={tableWrap}>
            <table className={table}>
              <thead>
                <tr className={theadRow}>
                  <th className={th}>Family</th>
                  <th className={th}>Email</th>
                  <th className={th}>Kids</th>
                  <th className={th}>Available</th>
                  <th className={th}>Used</th>
                  <th className={th}>Revoked</th>
                  <th className={th}>Expired</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {families.map((family) => {
                  const statuses = family.tokens.map((t) =>
                    getTokenStatus(t, now),
                  );
                  const counts = {
                    Available: statuses.filter((s) => s === "Available")
                      .length,
                    Used: statuses.filter((s) => s === "Used").length,
                    Revoked: statuses.filter((s) => s === "Revoked").length,
                    Expired: statuses.filter((s) => s === "Expired").length,
                  };

                  return (
                    <tr key={family.id} className={tr}>
                      <td className={td}>
                        <Link
                          href={`/admin/families/${family.id}`}
                          className="font-medium text-brand-700 hover:text-brand-800 hover:underline"
                        >
                          {family.name}
                        </Link>
                      </td>
                      <td className={td}>{family.email}</td>
                      <td className={td}>{family.children.length}</td>
                      <td className={td}>{counts.Available}</td>
                      <td className={td}>{counts.Used}</td>
                      <td className={td}>{counts.Revoked}</td>
                      <td className={td}>{counts.Expired}</td>
                      <td className={td}>
                        <StatusBadge
                          label={family.active ? "Active" : "Deactivated"}
                          tone={family.active ? "green" : "red"}
                        />
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
