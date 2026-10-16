/** Closing-date presentation — one rule for both the card footer and the list column. */
export interface ClosingInfo {
  label: string;
  /** Within seven days (2026-08-31 revision §7) — rendered in the urgency colour. */
  urgent: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whole calendar days from today to a stored date (2026-10-07): the stored date's UTC calendar
 * day minus the youth's LOCAL calendar day of `now`. Not hours: a deadline at 23:59 UTC tomorrow
 * is tomorrow, never "2 days left". The API stores dates as calendar days in UTC (a deadline as
 * the END of its day, …T23:59:59.999Z), which is why the stored date is read in UTC.
 */
export function calendarDaysUntil(date: Date, now: Date): number {
  const day = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((day - today) / DAY_MS);
}

/**
 * The status row owns the end date (2026-10-07): "Ends today" · "Ends tomorrow" · "N days left"
 * within the urgency window, then "Apply by 6 Nov". The card facts never name it.
 *
 * Closed is the instant, never the calendar: east of UTC a deadline still open (23:59 UTC
 * yesterday, by the local calendar) is not closed, and west of UTC one already passed is. An
 * open deadline the local calendar puts in the past reads "Ends today".
 */
export function closingInfo(dateEnd: string | null, now: Date): ClosingInfo {
  if (!dateEnd) return { label: "No deadline", urgent: false };
  const end = new Date(dateEnd);
  if (end.getTime() < now.getTime()) return { label: "Closed", urgent: false };
  const days = Math.max(0, calendarDaysUntil(end, now));
  if (days === 0) return { label: "Ends today", urgent: true };
  if (days === 1) return { label: "Ends tomorrow", urgent: true };
  if (days <= 7) return { label: `${days} days left`, urgent: true };
  // The API stores the deadline as the END of that calendar day in UTC (…T23:59:59.999Z), so
  // it is labelled in UTC — as the rest of the site does (`fmtDate`, opportunityTypeTheme).
  // In local time a 31 Dec deadline read "Apply by 01 Jan" in Johannesburg.
  return {
    label: `Apply by ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}`,
    urgent: false,
  };
}

/**
 * Whole years since a date of birth, the way the API counts them for its age bounds (the
 * birthday itself counts). `null` for a missing or unparseable date — the age preference then
 * simply does not apply.
 */
export function ageInYears(
  dateOfBirth: string | null | undefined,
  now: Date,
): number | null {
  if (!dateOfBirth) return null;
  const born = new Date(dateOfBirth);
  if (Number.isNaN(born.getTime())) return null;
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < born.getUTCMonth() ||
    (now.getUTCMonth() === born.getUTCMonth() &&
      now.getUTCDate() < born.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}
