# PSS Makeup Token Scheduler

A production web app built for a local swim school (Patti's Swim School) that replaces a manual, phone-call-driven process for missed lesson makeups with a self-serve token system.

## The problem

When a kid misses a swim lesson, the makeup has always been resolved by hand: a parent calls in, staff track who missed what and who has an open slot, and matching absences to makeups is a spreadsheet-and-memory exercise. It doesn't scale and details get lost.

## How it works

- A parent reports an upcoming absence (just a date and time, no schedule integration) and immediately earns a makeup token.
- That open slot becomes visible to other families, who can claim it using one of their own tokens.
- Tokens expire 30 days after being issued.
- Staff get a full admin view: manage postings, issue or revoke tokens with a required audit note, merge duplicate family records, deactivate families who've left, and see both sides of every claim to resolve disputes.

## Built with

- Next.js (App Router) + TypeScript
- Supabase (Postgres + magic-link auth via `@supabase/ssr`)
- Prisma ORM
- Resend for transactional email
- Tailwind CSS
- Luxon for timezone-correct scheduling

## Notable engineering decisions

- Claiming a slot is a single atomic transaction (a guarded conditional update), so two families can never successfully claim the same slot in a race. Verified against real concurrent transactions, not just reasoned through.
- Every staff action (issuing or revoking a token, editing a posting, deactivating a family) writes to a per-family audit log inside the same transaction as the change itself, so a blocked or guarded action never gets logged as having happened.
- All scheduling logic is anchored to Pacific time regardless of server or viewer timezone, since this is a single-location business. Implemented through the IANA tz database rather than a hardcoded offset, after an early bug where naive date construction silently used the server's local timezone.

## Status

Feature complete: auth, family onboarding, absence reporting and token issuance, browse/claim flow, token history, and the full admin dashboard are built and verified. Not yet deployed.

---

Built independently with Claude Code, without a prior software engineering background.
