import { Resend } from "resend";
import { formatPacificDate, formatPacificTime } from "@/lib/timezone";
import { FORFEIT_CUTOFF_HOURS } from "@/lib/release-claim";

// Separate from the Supabase auth SMTP setup — that only covers magic-link
// sign-in emails. This client sends transactional notifications directly.
//
// Resend's constructor throws immediately if given an empty string, which
// would crash the build/module load when RESEND_API_KEY isn't set yet. Fall
// back to a placeholder so construction always succeeds; an actual send
// with no real key fails naturally at the API call, which every caller
// already wraps in its own try/catch.
const resend = new Resend(process.env.RESEND_API_KEY || "re_not_configured");

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ??
  "PSS Makeup Tokens <notifications@pattisswimschool.com>";

// Staff emails include real family/child names — staff already sees
// everything with no identity hiding anywhere else in the app.
const STAFF_EMAIL = "info@pattisswimschool.com";

/**
 * resend.emails.send() does NOT throw on API failure — it resolves with
 * `{ data: null, error: {...} }`. Callers here rely on a throw to signal
 * failure (so their own try/catch can log it without touching whatever
 * already-committed DB write triggered the email), so this checks `error`
 * explicitly and throws. Without this, a failed send looks identical to a
 * successful one to every caller.
 */
async function sendEmail(payload: {
  from: string;
  to: string;
  subject: string;
  text: string;
}) {
  const { error } = await resend.emails.send(payload);

  if (error) {
    throw new Error(`Resend send failed: ${error.name} — ${error.message}`);
  }
}

export async function sendClaimConfirmationEmail(params: {
  to: string;
  childName: string;
  absenceDate: Date;
}) {
  const date = formatPacificDate(params.absenceDate);
  const time = formatPacificTime(params.absenceDate);

  await sendEmail({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Makeup lesson claimed",
    text: `You've claimed a makeup lesson for ${params.childName} on ${date} at ${time} (Pacific). This used one of your makeup tokens.`,
  });
}

export async function sendSlotClaimedNoticeEmail(params: {
  to: string;
  absenceDate: Date;
}) {
  const date = formatPacificDate(params.absenceDate);
  const time = formatPacificTime(params.absenceDate);

  await sendEmail({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Your posted absence has been claimed",
    text: `Your posted absence for ${date} at ${time} has been claimed by another family.`,
  });
}

export async function sendAbsenceReportedStaffEmail(params: {
  familyName: string;
  childName: string;
  absenceDate: Date;
}) {
  const date = formatPacificDate(params.absenceDate);
  const time = formatPacificTime(params.absenceDate);

  await sendEmail({
    from: FROM_EMAIL,
    to: STAFF_EMAIL,
    subject: "Absence reported",
    text: `${params.familyName} reported an absence for ${params.childName} on ${date} at ${time} (Pacific).`,
  });
}

export async function sendSlotClaimedStaffEmail(params: {
  postingFamilyName: string;
  postingChildName: string;
  claimingFamilyName: string;
  claimingChildName: string;
  absenceDate: Date;
}) {
  const date = formatPacificDate(params.absenceDate);
  const time = formatPacificTime(params.absenceDate);

  await sendEmail({
    from: FROM_EMAIL,
    to: STAFF_EMAIL,
    subject: "Makeup slot claimed",
    text: `${params.claimingFamilyName} (${params.claimingChildName}) claimed ${params.postingFamilyName}'s (${params.postingChildName}) open slot on ${date} at ${time} (Pacific).`,
  });
}

export async function sendSlotReleasedNoticeEmail(params: {
  to: string;
  absenceDate: Date;
}) {
  const date = formatPacificDate(params.absenceDate);
  const time = formatPacificTime(params.absenceDate);

  await sendEmail({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Your slot is open again",
    text: `The claim on your posted absence for ${date} at ${time} has been released. Your slot is open again for another family to claim.`,
  });
}

export async function sendClaimReleasedStaffEmail(params: {
  postingFamilyName: string;
  postingChildName: string;
  claimingFamilyName: string;
  claimingChildName: string;
  absenceDate: Date;
  releasedBy: "family" | "staff";
  forfeited: boolean;
}) {
  const date = formatPacificDate(params.absenceDate);
  const time = formatPacificTime(params.absenceDate);
  const byLine =
    params.releasedBy === "family"
      ? `${params.claimingFamilyName} released their own claim`
      : `Staff released ${params.claimingFamilyName}'s claim`;
  const forfeitLine = params.forfeited
    ? ` ${params.claimingFamilyName}'s token was forfeited, since this was within ${FORFEIT_CUTOFF_HOURS} hours of the lesson.`
    : "";

  await sendEmail({
    from: FROM_EMAIL,
    to: STAFF_EMAIL,
    subject: "Claim released",
    text: `${byLine} on ${params.postingFamilyName}'s (${params.postingChildName}) slot for ${date} at ${time} (Pacific). Originally claimed for ${params.claimingChildName}. The slot is open again.${forfeitLine}`,
  });
}

export async function sendTokenForfeitedEmail(params: {
  to: string;
  absenceDate: Date;
}) {
  const date = formatPacificDate(params.absenceDate);
  const time = formatPacificTime(params.absenceDate);

  await sendEmail({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Your makeup token was forfeited",
    text: `Your makeup token was forfeited because the claim on the slot for ${date} at ${time} (Pacific) was released within ${FORFEIT_CUTOFF_HOURS} hours of the lesson.`,
  });
}

export async function sendNewSlotAvailableEmail(params: {
  to: string;
  absenceDate: Date;
}) {
  const date = formatPacificDate(params.absenceDate);
  const time = formatPacificTime(params.absenceDate);

  await sendEmail({
    from: FROM_EMAIL,
    to: params.to,
    subject: "A new makeup slot just opened",
    text: `A new makeup slot opened up on ${date} at ${time} (Pacific). Log in to claim it with one of your makeup tokens before someone else does.`,
  });
}

export async function sendTokenExpiringReminderEmail(params: {
  to: string;
  expiresAt: Date;
}) {
  const date = formatPacificDate(params.expiresAt);

  await sendEmail({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Your makeup token expires soon",
    text: `One of your makeup tokens expires on ${date}. Use it to claim an open slot before then, or it will no longer be usable.`,
  });
}
