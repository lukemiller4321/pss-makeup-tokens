import Link from "next/link";
import { requireActiveFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { formatPacificDate, formatPacificTime, hoursBetween } from "@/lib/timezone";
import { getTokenStatus, type TokenStatus } from "@/lib/tokens";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { ReleaseClaimForm } from "./release-claim-form";
import { RELEASE_CUTOFF_HOURS } from "@/lib/release-claim";
import {
  btnGhost,
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

const statusTones: Record<TokenStatus, BadgeTone> = {
  Available: "green",
  Used: "gray",
  Revoked: "amber",
  Expired: "red",
};

export default async function TokensPage() {
  const family = await requireActiveFamily();

  const tokens = await prisma.token.findMany({
    where: { familyId: family.id },
    orderBy: { issuedAt: "desc" },
    include: {
      claim: {
        select: {
          id: true,
          claimingChild: { select: { name: true } },
          absence: { select: { date: true } },
        },
      },
    },
  });

  const now = new Date();
  const statuses = tokens.map((token) => getTokenStatus(token, now));
  const counts = {
    Available: statuses.filter((s) => s === "Available").length,
    Used: statuses.filter((s) => s === "Used").length,
    Revoked: statuses.filter((s) => s === "Revoked").length,
    Expired: statuses.filter((s) => s === "Expired").length,
  };

  return (
    <div className={pageWrap}>
      <div className={`w-full max-w-2xl ${pageInner}`}>
        <div className="flex items-center justify-between">
          <h1 className={pageTitle}>Your tokens</h1>
          <Link href="/" className={btnGhost}>
            Back home
          </Link>
        </div>

        <p className={mutedText}>
          Available: {counts.Available} · Used: {counts.Used} · Revoked:{" "}
          {counts.Revoked} · Expired: {counts.Expired}
        </p>

        {tokens.length === 0 ? (
          <p className={mutedText}>
            No tokens yet — report an absence to earn one.
          </p>
        ) : (
          <div className={tableWrap}>
            <table className={table}>
              <thead>
                <tr className={theadRow}>
                  <th className={th}>Issued</th>
                  <th className={th}>Status</th>
                  <th className={th}>Expires (Pacific)</th>
                  <th className={th}>Used on</th>
                  <th className={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token, index) => {
                  const status = statuses[index];
                  const canReleaseOnline =
                    status === "Used" &&
                    token.claim &&
                    hoursBetween(now, token.claim.absence.date) >
                      RELEASE_CUTOFF_HOURS;

                  return (
                    <tr key={token.id} className={tr}>
                      <td className={td}>
                        {formatPacificDate(token.issuedAt)}
                      </td>
                      <td className={td}>
                        <StatusBadge label={status} tone={statusTones[status]} />
                      </td>
                      <td className={td}>
                        {formatPacificDate(token.expiresAt)}
                      </td>
                      <td className={td}>
                        {token.claim
                          ? `${token.claim.claimingChild.name} — ${formatPacificDate(
                              token.claim.absence.date,
                            )} at ${formatPacificTime(token.claim.absence.date)} PT`
                          : "—"}
                      </td>
                      <td className={td}>
                        {status === "Used" && token.claim ? (
                          canReleaseOnline ? (
                            <ReleaseClaimForm claimId={token.claim.id} />
                          ) : (
                            <span className="text-xs text-gray-500">
                              Too close to the lesson to release online —
                              contact the school directly.
                            </span>
                          )
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
      </div>
    </div>
  );
}
