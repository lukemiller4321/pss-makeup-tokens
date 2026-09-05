import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFamilyForUser } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { formatPacificDate, formatPacificTime } from "@/lib/timezone";

type TokenStatus = "Available" | "Used" | "Expired";

function getTokenStatus(
  token: { usedAt: Date | null; expiresAt: Date },
  now: Date,
): TokenStatus {
  if (token.usedAt) {
    return "Used";
  }

  if (token.expiresAt < now) {
    return "Expired";
  }

  return "Available";
}

const statusStyles: Record<TokenStatus, string> = {
  Available:
    "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
  Used: "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  Expired:
    "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
};

export default async function TokensPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const family = await getFamilyForUser(user);

  if (!family) {
    redirect("/onboarding");
  }

  const tokens = await prisma.token.findMany({
    where: { familyId: family.id },
    orderBy: { issuedAt: "desc" },
    include: {
      claim: {
        select: {
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
    Expired: statuses.filter((s) => s === "Expired").length,
  };

  return (
    <div className="flex flex-1 flex-col items-center p-8">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Your tokens</h1>
          <Link href="/" className="text-sm underline">
            Back home
          </Link>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Available: {counts.Available} · Used: {counts.Used} · Expired:{" "}
          {counts.Expired}
        </p>

        {tokens.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            No tokens yet — report an absence to earn one.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-300 dark:border-zinc-700">
                <th className="py-2">Issued</th>
                <th className="py-2">Status</th>
                <th className="py-2">Expires (Pacific)</th>
                <th className="py-2">Used on</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token, index) => {
                const status = statuses[index];

                return (
                  <tr
                    key={token.id}
                    className="border-b border-zinc-200 dark:border-zinc-800"
                  >
                    <td className="py-2">
                      {formatPacificDate(token.issuedAt)}
                    </td>
                    <td className="py-2">
                      <span
                        className={`rounded border px-2 py-0.5 text-xs ${statusStyles[status]}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="py-2">
                      {formatPacificDate(token.expiresAt)}
                    </td>
                    <td className="py-2">
                      {token.claim
                        ? `${token.claim.claimingChild.name} — ${formatPacificDate(
                            token.claim.absence.date,
                          )} at ${formatPacificTime(token.claim.absence.date)} PT`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
