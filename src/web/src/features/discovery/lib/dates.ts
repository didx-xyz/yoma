/** Closing-date presentation — one rule for both the card footer and the list column. */
export interface ClosingInfo {
  label: string;
  /** Within seven days (2026-08-31 revision §7) — rendered in the urgency colour. */
  urgent: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function closingInfo(dateEnd: string | null, now: Date): ClosingInfo {
  if (!dateEnd) return { label: "No deadline", urgent: false };
  const end = new Date(dateEnd);
  const days = Math.ceil((end.getTime() - now.getTime()) / DAY_MS);
  if (days < 0) return { label: "Closed", urgent: false };
  if (days === 0) return { label: "Closes today", urgent: true };
  if (days <= 7)
    return { label: `${days} day${days === 1 ? "" : "s"} left`, urgent: true };
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
