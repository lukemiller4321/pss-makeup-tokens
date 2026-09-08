import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffFamily } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import {
  formatPacificDate,
  formatPacificTime,
  formatPacificDateTime,
} from "@/lib/timezone";
import { getTokenStatus, type TokenStatus } from "@/lib/tokens";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { IssueTokenForm } from "./issue-token-form";
import { RevokeTokenForm } from "./revoke-token-form";
import { DeactivateToggleForm } from "./deactivate-toggle-form";
import {
  btnGhost,
  btnSecondary,
  card,
  mutedText,
  pageInner,
  pageTitle,
  pageWrap,
  sectionTitle,
  table,
  tableWrap,
  td,
  th,
  theadRow,
  tr,
} from "@/lib/ui";

const actionLabels: Record<string, string> = {
  issue_token: "Issued a token",
  revoke_token: "Revoked a token",
  deactivate: "Deactivated the family",
  reactivate: "Reactivated the family",
  merge_family: "Merged in a duplicate family",
  edit_absence: "Edited an absence",
  delete_absence: "Deleted an absence",
};

const tokenStatusTones: Record<TokenStatus, BadgeTone> = {
  Available: "green",
  Used: "gray",
  Revoked: "amber",
  Expired: "red",
};

export default async function FamilyDetailPage({
  params,
}: PageProps<"/admin/families/[id]">) {
  await requireStaffFamily();

  const { id } = await params;

  const family = await prisma.family.findUnique({
    where: { id },
    include: {
      children: true,
      tokens: {
        orderBy: { issuedAt: "desc" },
        include: {
          claim: {
            select: {
              claimingChild: { select: { name: true } },
              absence: { select: { date: true } },
            },
          },
        },
      },
      absences: {
        orderBy: { date: "desc" },
        include: {
          child: { select: { name: true } },
          claim: {
            select: {
              claimingFamily: { select: { name: true } },
              claimingChild: { select: { name: true } },
            },
          },
        },
      },
      claims: {
        orderBy: { claimedAt: "desc" },
        include: {
          claimingChild: { select: { name: true } },
          absence: {
            select: {
              date: true,
              family: { select: { name: true } },
              child: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!family) {
    notFound();
  }

  const activityLog = await prisma.auditLog.findMany({
    where: { targetType: "Family", targetId: family.id },
    orderBy: { createdAt: "desc" },
    include: { staffFamily: { select: { name: true } } },
  });

  const now = new Date();

  return (
    <div className={pageWrap}>
      <div className={`w-full max-w-3xl ${pageInner}`}>
        <div className="flex items-center justify-between">
          <h1 className={pageTitle}>{family.name}</h1>
          <Link href="/admin/families" className={btnGhost}>
            Back to families
          </Link>
        </div>

        <section className={card}>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            <div>
              <dt className={mutedText}>Email</dt>
              <dd className="text-sm text-gray-900">{family.email}</dd>
            </div>
            <div>
              <dt className={mutedText}>Role</dt>
              <dd className="text-sm text-gray-900">{family.role}</dd>
            </div>
            <div>
              <dt className={mutedText}>Status</dt>
              <dd className="mt-0.5">
                <StatusBadge
                  label={family.active ? "Active" : "Deactivated"}
                  tone={family.active ? "green" : "red"}
                />
              </dd>
            </div>
            <div>
              <dt className={mutedText}>Kids</dt>
              <dd className="text-sm text-gray-900">
                {family.children.map((c) => c.name).join(", ") || "—"}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            <DeactivateToggleForm familyId={family.id} active={family.active} />
            <Link
              href={`/admin/families/${family.id}/merge`}
              className={btnSecondary}
            >
              Merge a duplicate into this family
            </Link>
          </div>
        </section>

        <section className={`flex flex-col gap-3 ${card}`}>
          <h2 className={sectionTitle}>Issue a token manually</h2>
          <IssueTokenForm familyId={family.id} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={sectionTitle}>Tokens</h2>
          {family.tokens.length === 0 ? (
            <p className={mutedText}>No tokens yet.</p>
          ) : (
            <div className={tableWrap}>
              <table className={table}>
                <thead>
                  <tr className={theadRow}>
                    <th className={th}>Issued</th>
                    <th className={th}>Status</th>
                    <th className={th}>Expires</th>
                    <th className={th}>Used on / Note</th>
                    <th className={th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {family.tokens.map((token) => {
                    const status = getTokenStatus(token, now);

                    return (
                      <tr key={token.id} className={tr}>
                        <td className={td}>
                          {formatPacificDate(token.issuedAt)}
                        </td>
                        <td className={td}>
                          <StatusBadge
                            label={status}
                            tone={tokenStatusTones[status]}
                          />
                        </td>
                        <td className={td}>
                          {formatPacificDate(token.expiresAt)}
                        </td>
                        <td className={td}>
                          {token.claim
                            ? `${token.claim.claimingChild.name} — ${formatPacificDate(
                                token.claim.absence.date,
                              )} at ${formatPacificTime(token.claim.absence.date)} PT`
                            : token.note
                              ? token.note
                              : "—"}
                        </td>
                        <td className={td}>
                          {status === "Available" ? (
                            <RevokeTokenForm
                              tokenId={token.id}
                              familyId={family.id}
                            />
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
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={sectionTitle}>Absences posted</h2>
          {family.absences.length === 0 ? (
            <p className={mutedText}>No absences posted yet.</p>
          ) : (
            <div className={tableWrap}>
              <table className={table}>
                <thead>
                  <tr className={theadRow}>
                    <th className={th}>Kid</th>
                    <th className={th}>Date</th>
                    <th className={th}>Time</th>
                    <th className={th}>Status</th>
                    <th className={th}>Claimed by</th>
                  </tr>
                </thead>
                <tbody>
                  {family.absences.map((absence) => (
                    <tr key={absence.id} className={tr}>
                      <td className={td}>{absence.child.name}</td>
                      <td className={td}>{formatPacificDate(absence.date)}</td>
                      <td className={td}>{formatPacificTime(absence.date)}</td>
                      <td className={td}>{absence.status}</td>
                      <td className={td}>
                        {absence.claim
                          ? `${absence.claim.claimingFamily.name} — ${absence.claim.claimingChild.name}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={sectionTitle}>Claims made</h2>
          {family.claims.length === 0 ? (
            <p className={mutedText}>
              This family hasn&apos;t claimed anyone else&apos;s posting.
            </p>
          ) : (
            <div className={tableWrap}>
              <table className={table}>
                <thead>
                  <tr className={theadRow}>
                    <th className={th}>Posted by</th>
                    <th className={th}>Their kid</th>
                    <th className={th}>Slot date</th>
                    <th className={th}>Claimed for</th>
                    <th className={th}>Claimed at</th>
                  </tr>
                </thead>
                <tbody>
                  {family.claims.map((claim) => (
                    <tr key={claim.id} className={tr}>
                      <td className={td}>{claim.absence.family.name}</td>
                      <td className={td}>{claim.absence.child.name}</td>
                      <td className={td}>
                        {formatPacificDate(claim.absence.date)} at{" "}
                        {formatPacificTime(claim.absence.date)}
                      </td>
                      <td className={td}>{claim.claimingChild.name}</td>
                      <td className={td}>
                        {formatPacificDate(claim.claimedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={sectionTitle}>Activity log</h2>
          {activityLog.length === 0 ? (
            <p className={mutedText}>
              No staff activity recorded for this family yet.
            </p>
          ) : (
            <div className={tableWrap}>
              <table className={table}>
                <thead>
                  <tr className={theadRow}>
                    <th className={th}>When</th>
                    <th className={th}>By</th>
                    <th className={th}>Action</th>
                    <th className={th}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLog.map((entry) => (
                    <tr key={entry.id} className={tr}>
                      <td className={td}>
                        {formatPacificDateTime(entry.createdAt)}
                      </td>
                      <td className={td}>{entry.staffFamily.name}</td>
                      <td className={td}>
                        {actionLabels[entry.action] ?? entry.action}
                      </td>
                      <td className={td}>{entry.details ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
