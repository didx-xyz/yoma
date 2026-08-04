/**
 * Financial-year configuration helpers for the Treasury admin form.
 *
 * ⚠️ THE ROLLOVER GUARD IS THE REASON THIS FILE EXISTS. Moving the financial year forward resets
 * the Treasury's *and every organisation's* current-financial-year cumulatives to zero
 * (TreasuryService.Update → ResetCurrentFinancialYear). That is destructive and irreversible, so
 * the admin has to be warned before the PATCH goes out.
 *
 * This module deliberately does NOT port `TreasuryHelper.EvaluateFinancialYear`. Its year-pick and
 * double day-clamp (the deliberate 29-February handling, TreasuryHelper.cs:30-37) are easy to get
 * subtly wrong, and the server remains the only authority on whether a rollover happens. Instead:
 *
 *   1. the candidate financial-year start is derived only in the cases where NO clamping can
 *      occur — which is every configuration except 29 February (see `assessFinancialYearChange`);
 *   2. it is compared against `financialYearStartDate` from `GET /treasury` — the exact operand the
 *      server compares against (TreasuryHelper.cs:39);
 *   3. anything that could turn on the clamp, or on a day of clock skew between browser and
 *      server, is reported as uncertain — and an uncertain answer warns.
 *
 * In other words: the guard may warn when no reset would have happened, but it will not stay quiet
 * when one would.
 */

/** A date as the API serialises `DateOnly` — "YYYY-MM-DD". */
export type DateOnlyString = string;

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** 1-based month options for the month picker. */
export const MONTH_OPTIONS = MONTH_NAMES.map((name, index) => ({
  value: index + 1,
  label: name,
}));

/** Days in a 1-based month of a given year, in UTC (day 0 of the next month). */
export const daysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/**
 * Day options offered for a month. Mirrors `TreasuryRequestUpdateValidator:15-21`, which validates
 * the day against a fixed leap-safe reference year (2000) — so February offers 29, and 30/31
 * February are rejected at the input rather than at submit.
 */
export const REFERENCE_LEAP_YEAR = 2000;

export const daysInMonthForConfig = (month: number): number =>
  month >= 1 && month <= 12 ? daysInMonth(REFERENCE_LEAP_YEAR, month) : 31;

export const dayOptionsForMonth = (month: number): number[] =>
  Array.from({ length: daysInMonthForConfig(month) }, (_, index) => index + 1);

/** True when the day is valid for the month, per the same leap-safe reference year. */
export const isValidDayForMonth = (month: number, day: number): boolean =>
  Number.isInteger(month) &&
  Number.isInteger(day) &&
  month >= 1 &&
  month <= 12 &&
  day >= 1 &&
  day <= daysInMonthForConfig(month);

const pad = (value: number): string => value.toString().padStart(2, "0");

const toDateOnly = (year: number, month: number, day: number): DateOnlyString =>
  `${year}-${pad(month)}-${pad(day)}`;

/**
 * "YYYY-MM-DD" parts. Deliberately string-based: `new Date("2026-03-01")` is parsed as UTC
 * midnight and then rendered in local time, which shows the wrong day west of Greenwich.
 */
const parseDateOnly = (
  value: DateOnlyString | null | undefined,
): { year: number; month: number; day: number } | null => {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;

  return { year, month, day };
};

/** Human date for a `DateOnly` — "1 March 2026". */
export const formatFinancialYearStartDate = (
  value: DateOnlyString | null | undefined,
  empty = "—",
): string => {
  const parts = parseDateOnly(value);
  if (!parts) return empty;
  return `${parts.day} ${MONTH_NAMES[parts.month - 1]} ${parts.year}`;
};

/** Human month/day for the configuration itself, with no year — "1 March". */
export const formatFinancialYearConfig = (
  month: number | null | undefined,
  day: number | null | undefined,
  empty = "—",
): string => {
  if (!month || !day || month < 1 || month > 12) return empty;
  return `${day} ${MONTH_NAMES[month - 1]}`;
};

export interface FinancialYearAssessment {
  /** Best-effort candidate start date; null when it could not be derived safely. */
  candidateStartDate: DateOnlyString | null;
  /** The server-derived date the candidate is compared against. */
  persistedStartDate: DateOnlyString | null;
  /** Best-effort answer to "will the server roll the financial year forward?". */
  requiresRollover: boolean;
  /** True when the answer cannot be determined client-side (see the file header). */
  isUncertain: boolean;
  /**
   * The guard. Warn before submitting whenever a reset is expected OR the answer is uncertain —
   * the failure we cannot afford is a silent reset.
   */
  shouldWarn: boolean;
}

/**
 * Compares the submitted financial-year configuration against the persisted start date and decides
 * whether the admin must be warned about a current-financial-year reset.
 *
 * NB: an *unchanged* month/day can still require a rollover. The persisted start date is only moved
 * forward when something touches the Treasury (the daily rollover job, a reward allocation, or this
 * PATCH), so a configuration that has not changed since the anniversary passed still moves the year
 * forward on save. That is why the comparison is candidate-vs-persisted-date and never
 * new-config-vs-old-config.
 *
 * @param now optional override for the current UTC instant (tests)
 */
export const assessFinancialYearChange = (
  month: number,
  day: number,
  persistedStartDate: DateOnlyString | null | undefined,
  now: Date = new Date(),
): FinancialYearAssessment => {
  const persisted = parseDateOnly(persistedStartDate);
  const persistedStartDateNormalized = persisted
    ? toDateOnly(persisted.year, persisted.month, persisted.day)
    : null;

  const uncertain = (
    candidateStartDate: DateOnlyString | null = null,
  ): FinancialYearAssessment => ({
    candidateStartDate,
    persistedStartDate: persistedStartDateNormalized,
    requiresRollover: false,
    isUncertain: true,
    shouldWarn: true,
  });

  // No usable configuration or no persisted date to compare against — the server decides, so warn.
  if (!isValidDayForMonth(month, day)) return uncertain();
  if (!persisted) return uncertain();

  // 29 February: the server clamps the configured day twice, once against the calendar year it
  // picks and once against the reference year, specifically so a 29-February configuration is not
  // silently degraded to the 28th. We do not reproduce that decision — we warn instead.
  if (month === 2 && day === 29) return uncertain();

  // Every other configuration is clamp-free: the validator already caps the day at the longest
  // possible length of the month, and outside February a month's length does not vary by year.
  const todayYear = now.getUTCFullYear();
  const todayMonth = now.getUTCMonth() + 1;
  const todayDay = now.getUTCDate();

  const asNumber = (year: number, m: number, d: number) =>
    year * 10000 + m * 100 + d;

  const today = asNumber(todayYear, todayMonth, todayDay);
  const thisYearsAnniversary = asNumber(todayYear, month, day);

  // A day of clock skew between the browser and the server's UTC clock would flip the year pick,
  // and with it the answer by a whole year. Too close to call → warn.
  const daysFromAnniversary = Math.abs(
    Date.UTC(todayYear, month - 1, day) -
      Date.UTC(todayYear, todayMonth - 1, todayDay),
  );
  if (daysFromAnniversary <= 24 * 60 * 60 * 1000) {
    return uncertain(toDateOnly(todayYear, month, day));
  }

  const candidateYear =
    thisYearsAnniversary <= today ? todayYear : todayYear - 1;
  const candidateStartDate = toDateOnly(candidateYear, month, day);

  const requiresRollover =
    asNumber(candidateYear, month, day) >
    asNumber(persisted.year, persisted.month, persisted.day);

  return {
    candidateStartDate,
    persistedStartDate: persistedStartDateNormalized,
    requiresRollover,
    isUncertain: false,
    shouldWarn: requiresRollover,
  };
};
