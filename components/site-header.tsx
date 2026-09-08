import Image from "next/image";
import Link from "next/link";

export function SiteHeader({
  isAdmin,
  familyName,
}: {
  isAdmin?: boolean;
  familyName?: string | null;
}) {
  return (
    <header className={isAdmin ? "bg-brand-950" : "bg-brand-800"}>
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href={isAdmin ? "/admin" : "/"}
            className="flex items-center gap-2 text-base font-semibold tracking-tight text-white"
          >
            <Image
              src="/logo.png"
              alt="Patti's Swim School"
              width={28}
              height={40}
              className="h-10 w-auto rounded-md"
              priority
            />
            PSS Makeup Tokens
          </Link>
          {isAdmin && (
            <span className="rounded-full bg-accent-500 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
              Admin
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {familyName && (
            <span className="hidden text-sm text-brand-100 sm:inline">
              {familyName}
            </span>
          )}
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="text-sm font-medium text-brand-100 transition-colors hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
