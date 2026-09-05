# PSS Makeup Token Scheduler — Project Spec

This file lives at the project root so Claude Code always has full context without needing it re-explained turn by turn.

## What this is

A standalone app for Patti's Swim School where parents can report an upcoming absence, immediately earn a makeup token, and use that token to claim another family's open absence slot. Built separately from pssreports.com and pssmakeups.com, then linked as a tab/nav item on pattisswimschool.com once it's working, matching how those two apps are already set up.

## Current build status (updated as of this session)

Done and verified end-to-end:
- Auth (Supabase magic link via `@supabase/ssr`, sign-in/callback/sign-out)
- Family/kid onboarding (creates `Family` + `Child` rows on first sign-in)
- Report an absence + immediate token issuance (`app/absences/new`)
- Browse + claim flow with atomic race-safe claim transaction (`app/browse`)
- Family-facing token history view (`app/tokens`)

Not yet built:
- Admin dashboard (in progress — see Staff/Admin section below)
- Resend SMTP swap in Supabase dashboard (still using Supabase's default auth email sender; manual dashboard step, not code)
- Deploy to Vercel
- Nav link on pattisswimschool.com

## Deviations from the original draft spec (and why)

- **Prisma pinned to `6.19.3`**, not latest. Prisma 7/8 removed `url`/`directUrl` support from `schema.prisma`'s datasource block, which this project's connection setup depends on.
- **`.env.local` uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** (Supabase's newer key format, `sb_publishable_...`), not `NEXT_PUBLIC_SUPABASE_ANON_KEY`. It's the direct equivalent for `@supabase/ssr` purposes — just a naming update on Supabase's side since this spec was drafted.
- **`prisma.config.ts`** points the Prisma CLI's connection at `DIRECT_URL` (port 5432) explicitly. Supabase's pooled connection (PgBouncer, port 6543) doesn't support the operations Prisma needs for `migrate`/`db push` — both hung indefinitely against the pooled connection before this fix. The app's own runtime queries still use `DATABASE_URL` (pooled) via the schema's datasource block.
- **`@supabase/ssr` server client/middleware use `getAll`/`setAll`**, not `get`/`set`/`remove` — the installed version deprecated the latter.
- **All date/times are anchored to Pacific Time (`America/Los_Angeles`)**, always, regardless of server or viewer timezone — this is a single-location business, so timezone-agnostic handling was explicitly rejected in favor of always-Pacific. Implemented via `lib/timezone.ts` using Luxon (`DateTime.fromISO(..., { zone: "America/Los_Angeles" })`), which correctly handles the PST/PDT DST transition via the IANA tz database rather than a hardcoded offset. Every date/time input on the absence-report form is labeled "(Pacific)" so parents aren't confused about which timezone they're entering. All display of stored times (on `/absences`, `/browse`, `/tokens`, confirmation banners) goes through `formatPacificDate`/`formatPacificTime`, never a raw `toLocaleString()`. This was hit as a real bug: naive `new Date(\`${date}T${time}\`)` construction silently used whatever timezone the Node process happened to be running in, which only looked correct in local dev because the dev machine happens to be set to Pacific — it would have silently broken by 7-8 hours the moment this deployed to Vercel (which defaults to UTC).
- **`dotenv` may print a self-promotional console line** on load (a known, publicly-discussed behavior added in its v17 line advertising the maintainer's other project). It's benign — not a security issue, nothing is exfiltrated — but flagging it here so it's not mistaken for a compromised dependency if it resurfaces. Pin to a 16.x version if it becomes annoying.

## Core mechanics (decided)

- A parent creates an account (email only, no password required, see Auth below) and can have multiple kids under one account.
- To report an absence, a parent freely enters a date and time, no prepopulated schedule, no Mindbody integration, no class/level field. Just date and time (Pacific).
- Submitting an absence immediately credits the family's account with one makeup token. Token issuance is unconditional, it does not depend on anyone claiming the slot.
- Tokens expire 30 days after being issued.
- The absence itself becomes an open listing other families can browse and claim using one of their own tokens.
- Open listings show only date and time to other parents. The absent child's name and family are never shown publicly, only visible to staff and to the posting family themselves. Once claimed, the original poster does not see who claimed it.
- No class/level matching. Any open slot can be claimed by any family holding an unexpired token.

## Auth

Supabase magic-link (passwordless) auth. Parents enter their email, get a sign-in link, click it, they're in. Reasons: no password-reset support burden for a low-frequency-use app, and it makes "staff creates an account for a family that hasn't signed up yet" trivial, since there's no password to set, just an email on file that the family can later use to log in themselves.

Password login can be added later without migrating anything, since Supabase auth accounts are keyed by email regardless of which method is used. When ready, add a "set a password" option in account settings; magic link keeps working as a fallback so nobody gets locked out.

Route auth emails through Resend (already used for pssreports.com) via Supabase's custom SMTP setting, instead of Supabase's default sender. **Not done yet** — still on Supabase's default sender.

## Staff / Admin

A flat `STAFF` role flag on the same account model (the `Role` enum on `Family`), no permission tiers (team is small: Patti, Courtney, Ariel). Staff log into the same app and land on an admin view instead of the parent view. There's no signup flow for staff — flip a `Family.role` to `STAFF` directly in the database for these three accounts once they exist.

Admin capabilities:
- Dashboard of all absence postings, filterable by status (open / claimed / expired), searchable by family name.
- Log an absence on behalf of a parent who calls in. If the family has no account yet, staff can create a minimal one inline (email, family name, kid name) right there, then log the absence against it. No separate "unclaimed account" state needed, since magic-link auth means the parent can log into that same account later just by using that email.
- Edit or delete an existing posting (fix a typo, remove a duplicate or cancelled one).
- View and manually adjust any family's token balance (issue or revoke), for edge cases like abuse or a goodwill token outside the normal flow.
- See both sides of a claim (who posted, who claimed), since parents can't see each other, for resolving disputes.
- Search and manage families (merge duplicates, deactivate a family that's left).

## Data model (Prisma — as actually implemented)

```prisma
enum Role {
  PARENT
  STAFF
}

enum AbsenceStatus {
  OPEN
  CLAIMED
  EXPIRED
}

model Family {
  id        String    @id @default(uuid())
  email     String    @unique
  name      String
  role      Role      @default(PARENT)
  createdAt DateTime  @default(now())
  children  Child[]
  absences  Absence[]
  tokens    Token[]
  claims    Claim[]
}

model Child {
  id       String    @id @default(uuid())
  name     String
  familyId String
  family   Family    @relation(fields: [familyId], references: [id])
  absences Absence[]
  claims   Claim[]
}

model Absence {
  id        String        @id @default(uuid())
  date      DateTime
  familyId  String
  family    Family        @relation(fields: [familyId], references: [id])
  childId   String
  child     Child         @relation(fields: [childId], references: [id])
  status    AbsenceStatus @default(OPEN)
  createdAt DateTime      @default(now())
  claim     Claim?
}

model Token {
  id        String    @id @default(uuid())
  familyId  String
  family    Family    @relation(fields: [familyId], references: [id])
  issuedAt  DateTime  @default(now())
  expiresAt DateTime
  usedAt    DateTime?
  claim     Claim?
}

model Claim {
  id               String   @id @default(uuid())
  absenceId        String   @unique
  absence          Absence  @relation(fields: [absenceId], references: [id])
  claimingFamilyId String
  claimingFamily   Family   @relation(fields: [claimingFamilyId], references: [id])
  claimingChildId  String
  claimingChild    Child    @relation(fields: [claimingChildId], references: [id])
  tokenId          String   @unique
  token            Token    @relation(fields: [tokenId], references: [id])
  claimedAt        DateTime @default(now())
}
```

Claiming an absence must be a single transaction that creates the `Claim`, flips `Absence.status` to `CLAIMED`, and marks the `Token.usedAt`, all together, so two families can't successfully claim the same slot in a race. **Implemented** as an atomic conditional update (`updateMany` with a `status: "OPEN"` guard in the `WHERE` clause) under Postgres's default `READ COMMITTED` isolation — the row lock taken by the guarded `UPDATE` makes this safe without needing `SERIALIZABLE` or a retry loop. Verified against real concurrent transactions, not just reasoned about.

## Build order (each piece testable before the next)

1. ~~Auth (sign in, session handling)~~ — done
2. ~~Family/kid account setup~~ — done
3. ~~Report an absence (form + token issuance)~~ — done
4. ~~Browse open absences + claim flow (with the atomic claim transaction)~~ — done
5. ~~Family-facing token history view~~ — done
6. **Admin dashboard (absence list, manual entry, corrections, token overrides) — in progress**

## Deploy (not started yet)

Deploy to Vercel: new Vercel project linked to the GitHub repo, all env vars added in Vercel's project settings. Use Vercel's automatic preview deployments for every branch/PR to test changes before merging to main, rather than testing against production directly.

Go live: once tested end to end with real (but test) accounts, set up the subdomain and add the nav link on pattisswimschool.com.
