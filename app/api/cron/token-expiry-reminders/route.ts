import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTokenExpiringReminderEmail } from "@/lib/email";

const REMINDER_WINDOW_DAYS = 5;

// Not wired up to Vercel Cron yet (app isn't deployed) — trigger manually
// with either `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>`.
export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : request.nextUrl.searchParams.get("secret");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + REMINDER_WINDOW_DAYS);

  const tokens = await prisma.token.findMany({
    where: {
      expiresAt: { gte: now, lte: windowEnd },
      usedAt: null,
      revokedAt: null,
      reminderSentAt: null,
    },
    include: { family: { select: { email: true } } },
  });

  let sent = 0;
  let failed = 0;

  for (const token of tokens) {
    try {
      await sendTokenExpiringReminderEmail({
        to: token.family.email,
        expiresAt: token.expiresAt,
      });

      await prisma.token.update({
        where: { id: token.id },
        data: { reminderSentAt: new Date() },
      });

      sent++;
    } catch (err) {
      console.error(
        `Failed to send expiry reminder for token ${token.id}:`,
        err,
      );
      failed++;
    }
  }

  return NextResponse.json({ candidates: tokens.length, sent, failed });
}
