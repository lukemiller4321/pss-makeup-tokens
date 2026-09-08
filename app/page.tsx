import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { formatPacificDate, formatPacificTime } from "@/lib/timezone";
import { availableTokenWhere } from "@/lib/tokens";
import { MINIMUM_NOTICE_HOURS } from "@/lib/report-absence";
import {
  alertSuccess,
  btnPrimary,
  btnSecondary,
  card,
  mutedText,
  pageInner,
  pageTitle,
  pageWrap,
} from "@/lib/ui";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;

  const family = await requireActiveFamily();

  if (family.role === "STAFF") {
    redirect("/admin");
  }

  const activeTokenCount = await prisma.token.count({
    where: { familyId: family.id, ...availableTokenWhere(new Date()) },
  });

  const reported = params.reported === "1";
  const tokenIssuedParam = params.tokenIssued === "1";
  const tokenExpiresParam =
    typeof params.tokenExpires === "string" ? params.tokenExpires : undefined;
  const claimed = params.claimed === "1";
  const slotDateParam =
    typeof params.slotDate === "string" ? params.slotDate : undefined;

  return (
    <div className={pageWrap}>
      <div className={`w-full max-w-2xl ${pageInner}`}>
        {reported && (
          <div className={alertSuccess}>
            {tokenIssuedParam ? (
              <>
                <p>Absence reported — you&apos;ve earned a makeup token.</p>
                {tokenExpiresParam && (
                  <p>
                    Token expires{" "}
                    {formatPacificDate(new Date(tokenExpiresParam))}
                  </p>
                )}
              </>
            ) : (
              <p>
                Absence reported. This was within {MINIMUM_NOTICE_HOURS / 24}{" "}
                days of the lesson, so it didn&apos;t earn a makeup token.
              </p>
            )}
          </div>
        )}

        {claimed && (
          <div className={alertSuccess}>
            <p>Slot claimed!</p>
            {slotDateParam && (
              <p>
                {formatPacificDate(new Date(slotDateParam))} at{" "}
                {formatPacificTime(new Date(slotDateParam))} PT
              </p>
            )}
          </div>
        )}

        <div className={card}>
          <h1 className={pageTitle}>{family.name}</h1>
          <p className={`mt-1 ${mutedText}`}>
            {family.children.map((child) => child.name).join(", ") || "—"}
          </p>

          <div className="mt-6 flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3">
            <span className="text-sm font-medium text-brand-900">
              Makeup tokens available
            </span>
            <span className="text-xl font-semibold text-brand-700">
              {activeTokenCount}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/absences/new" className={btnPrimary}>
              Report an absence
            </Link>
            <Link href="/absences" className={btnSecondary}>
              My absences
            </Link>
            <Link href="/browse" className={btnSecondary}>
              Browse open slots
            </Link>
            <Link href="/tokens" className={btnSecondary}>
              My tokens
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
