import {
  ACCESSIBILITY_NAME_OTHER,
  TARGETED_GROUP_NAME_OPEN_TO_ALL,
  type Currency,
  type SustainableDevelopmentGoal,
} from "~/api/models/lookups";
import {
  ACCESSIBILITY_SUPPORT_LABELS,
  AccessibilitySupport,
  REWARD_TYPE_LABELS,
  RewardType,
} from "~/api/models/opportunity";

// ─────────────────────────────────────────────────────────────────────────────
// Core opportunity metadata helpers (API 2026-09-28: provider, incentive / reward,
// accessibility, age, targeted groups, SDGs). Pure — shared by the admin editor
// (`/organisations/[id]/opportunities/[opportunityId]`) and its info page. These
// are CORE fields, not custom fields; the rules mirror OpportunityRequestValidatorBase.
// ─────────────────────────────────────────────────────────────────────────────

const REWARD_TYPES = Object.values(RewardType) as string[];
const ACCESSIBILITY_SUPPORTS = Object.values(AccessibilitySupport) as string[];

/**
 * The read model types `rewardType` loosely (`RewardType | string`). Unknown / missing values
 * fall back the way the API's migration backfilled them: ZLTO when a ZLTO reward exists.
 */
export const normalizeRewardType = (
  value: string | null | undefined,
  zltoReward?: number | null,
): RewardType =>
  value && REWARD_TYPES.includes(value)
    ? (value as RewardType)
    : zltoReward != null
      ? RewardType.ZLTO
      : RewardType.None;

export const normalizeAccessibilitySupport = (
  value: string | null | undefined,
): AccessibilitySupport | null =>
  value && ACCESSIBILITY_SUPPORTS.includes(value)
    ? (value as AccessibilitySupport)
    : null;

/** A finite number, else null — `valueAsNumber` inputs yield NaN when empty. */
export const finiteOrNull = (
  value: number | null | undefined,
): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const idOfName = (
  items: { id: string; name: string }[] | null | undefined,
  name: string,
): string | null =>
  items?.find((item) => item.name.toLowerCase() === name.toLowerCase())?.id ??
  null;

/** Id of the `Other` accommodation — the one that needs a description. */
export const accommodationOtherIdOf = (
  options: { id: string; name: string }[] | null | undefined,
) => idOfName(options, ACCESSIBILITY_NAME_OTHER);

/** Id of the `Open to all` targeted group — the one that cannot be combined. */
export const openToAllIdOf = (
  groups: { id: string; name: string }[] | null | undefined,
) => idOfName(groups, TARGETED_GROUP_NAME_OPEN_TO_ALL);

/**
 * Keeps "Open to all" exclusive while the admin edits: choosing it replaces every other group,
 * and choosing another group drops it.
 */
export const withExclusiveOpenToAll = (
  previous: string[],
  next: string[],
  openToAllId: string | null,
): string[] => {
  if (!openToAllId || !next.includes(openToAllId)) return next;
  if (!previous.includes(openToAllId)) return [openToAllId];
  return next.length > 1 ? next.filter((id) => id !== openToAllId) : next;
};

/** Accommodations are allowed only for Yes / AvailableOnRequest (required for Yes). */
export const allowsAccommodations = (
  support: AccessibilitySupport | string | null | undefined,
) =>
  support === AccessibilitySupport.Yes ||
  support === AccessibilitySupport.AvailableOnRequest;

export const formatSustainableDevelopmentGoal = (
  goal: Pick<SustainableDevelopmentGoal, "number" | "name">,
) => `${goal.number}. ${goal.name}`;

export const formatCurrency = (currency: Pick<Currency, "code" | "name">) =>
  `${currency.code} — ${currency.name}`;

export const formatIncentivized = (value: boolean | null | undefined) =>
  value === true ? "Yes" : value === false ? "No" : "Not specified";

export const formatRewardType = (value: string | null | undefined) =>
  value && REWARD_TYPES.includes(value)
    ? REWARD_TYPE_LABELS[value as RewardType]
    : null;

export const formatAccessibilitySupport = (value: string | null | undefined) =>
  value && ACCESSIBILITY_SUPPORTS.includes(value)
    ? ACCESSIBILITY_SUPPORT_LABELS[value as AccessibilitySupport]
    : null;

/** "150 USD" — informational; no conversion or payment is implied. */
export const formatPartnerIncentive = (
  amount: number | null | undefined,
  currencyCode: string | null | undefined,
): string | null =>
  amount == null
    ? null
    : `${amount.toLocaleString("en", { maximumFractionDigits: 4 })}${
        currencyCode ? ` ${currencyCode}` : ""
      }`;

/** Inclusive whole-year bounds: "16–25", "16+", "Up to 25", or null when neither is set. */
export const formatAgeRange = (
  ageFrom: number | null | undefined,
  ageTo: number | null | undefined,
): string | null => {
  const from = finiteOrNull(ageFrom);
  const to = finiteOrNull(ageTo);
  if (from !== null && to !== null)
    return from === to ? `${from}` : `${from}–${to}`;
  if (from !== null) return `${from}+`;
  if (to !== null) return `Up to ${to}`;
  return null;
};

/** Positive with at most four decimal places — the API's PrecisionScale(18, 4). */
export const PARTNER_INCENTIVE_AMOUNT_MAX = 100000000000000;
const FOUR_DECIMALS_REGEX = /^\d+(\.\d{1,4})?$/;

export const getPartnerIncentiveAmountError = (
  amount: number | null | undefined,
): string | undefined => {
  const value = finiteOrNull(amount);
  if (value === null) return "Incentive amount is required.";
  if (value <= 0) return "Incentive amount must be greater than 0.";
  if (value >= PARTNER_INCENTIVE_AMOUNT_MAX)
    return "Incentive amount is too large.";
  if (!FOUR_DECIMALS_REGEX.test(value.toString()))
    return "Incentive amount supports at most four decimal places.";
  return undefined;
};
