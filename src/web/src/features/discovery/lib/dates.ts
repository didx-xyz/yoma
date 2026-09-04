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
  return {
    label: `Apply by ${end.toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`,
    urgent: false,
  };
}
