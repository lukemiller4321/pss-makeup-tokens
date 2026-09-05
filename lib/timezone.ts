import { DateTime } from "luxon";

// This app always operates in Pacific Time, regardless of where the parent,
// staff, or server happens to be — never the server's ambient system zone.
export const APP_TIME_ZONE = "America/Los_Angeles";

/**
 * Combines a "YYYY-MM-DD" date and "HH:mm" time, interpreted as that exact
 * wall-clock moment in APP_TIME_ZONE, into the equivalent JS Date (UTC
 * instant). Correctly accounts for PST vs PDT via the IANA tz database —
 * no fixed offset.
 */
export function combinePacificDateTime(date: string, time: string): Date | null {
  const dt = DateTime.fromISO(`${date}T${time}`, { zone: APP_TIME_ZONE });

  if (!dt.isValid) {
    return null;
  }

  return dt.toJSDate();
}

export function formatPacificDate(date: Date): string {
  return DateTime.fromJSDate(date).setZone(APP_TIME_ZONE).toFormat("MMM d, yyyy");
}

export function formatPacificTime(date: Date): string {
  return DateTime.fromJSDate(date).setZone(APP_TIME_ZONE).toFormat("h:mm a");
}

export function formatPacificDateTime(date: Date): string {
  return DateTime.fromJSDate(date)
    .setZone(APP_TIME_ZONE)
    .toFormat("MMM d, yyyy 'at' h:mm a");
}

/** Value for an <input type="date"> pre-filled from a stored instant. */
export function toPacificDateInputValue(date: Date): string {
  return DateTime.fromJSDate(date).setZone(APP_TIME_ZONE).toFormat("yyyy-MM-dd");
}

/** Value for an <input type="time"> pre-filled from a stored instant. */
export function toPacificTimeInputValue(date: Date): string {
  return DateTime.fromJSDate(date).setZone(APP_TIME_ZONE).toFormat("HH:mm");
}
