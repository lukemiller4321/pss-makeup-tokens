import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFamilyForUser } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { formatPacificDate, formatPacificTime } from "@/lib/timezone";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;

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

  if (family.role === "STAFF") {
    redirect("/admin");
  }

  const activeTokenCount = await prisma.token.count({
    where: {
      familyId: family.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  const reported = params.reported === "1";
  const tokenExpiresParam =
    typeof params.tokenExpires === "string" ? params.tokenExpires : undefined;
  const claimed = params.claimed === "1";
  const slotDateParam =
    typeof params.slotDate === "string" ? params.slotDate : undefined;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      {reported && (
        <div className="rounded border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <p>Absence reported — you&apos;ve earned a makeup token.</p>
          {tokenExpiresParam && (
            <p>
              Token expires {formatPacificDate(new Date(tokenExpiresParam))}
            </p>
          )}
        </div>
      )}

      {claimed && (
        <div className="rounded border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <p>Slot claimed!</p>
          {slotDateParam && (
            <p>
              {formatPacificDate(new Date(slotDateParam))} at{" "}
              {formatPacificTime(new Date(slotDateParam))} PT
            </p>
          )}
        </div>
      )}

      <h1 className="text-xl font-semibold">{family.name}</h1>
      <ul className="text-zinc-600 dark:text-zinc-400">
        {family.children.map((child) => (
          <li key={child.id}>{child.name}</li>
        ))}
      </ul>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Makeup tokens available: {activeTokenCount}
      </p>

      <div className="flex gap-2">
        <Link
          href="/absences/new"
          className="rounded bg-black px-3 py-2 text-white dark:bg-white dark:text-black"
        >
          Report an absence
        </Link>
        <Link
          href="/absences"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700"
        >
          My absences
        </Link>
        <Link
          href="/browse"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700"
        >
          Browse open slots
        </Link>
        <Link
          href="/tokens"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700"
        >
          My tokens
        </Link>
      </div>

      <form action="/auth/sign-out" method="post">
        <button
          type="submit"
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
