import type { Currency } from "~/api/models/lookups";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { RewardType } from "~/api/models/opportunity";
import {
  JOB_CUSTOM_FIELD_KEYS,
  JOB_PAY_INTERVAL_OPTIONS,
} from "~/lib/customFields/customFieldRules";
import { formatNumber as amount } from "./format";

/**
 * The money-badge precedence — the ONE place the rule lives. Four concepts share the card's
 * money slot; `<MoneyBadge>` renders whatever this resolves and nothing else decides it.
 *
 * ZLTO always keeps its own pill (Yoma pays it); the pay line below is a separate concept:
 *   salary range  >  partner incentive (labelled partner-paid — Yoma processes nothing)
 *                 >  "Paid — amount not disclosed"  >  nothing.
 *
 * Fed by `moneyFactsOf`: reward type, partner incentive and `incentivized` from the core fields
 * (2026-09-29), and a disclosed Job salary from its system-controlled custom fields (2026-09-30)
 * — the currency is a lookup id (labelled from the currency lookup), the pay interval a
 * protected option key (`JOB_PAY_INTERVAL_OPTIONS`).
 */

export interface MoneyFacts {
  zltoReward: number | null;
  /**
   * A disclosed Job salary: range + ISO currency + pay interval, e.g. "ZAR 8 000–12 000 / mo".
   * Currency and interval are empty when they cannot be labelled (lookup not loaded, unknown key).
   */
  salary: {
    from: number | null;
    to: number | null;
    currency: string;
    interval: string;
  } | null;
  /** Informational only; Yoma processes nothing. */
  partnerIncentive: { amount: number; currency: string } | null;
  /**
   * Pays, with no amount to show. `incentivized` on a result whose reward type is None — for a
   * Job that is its salary; a non-Job that incentivizes always names ZLTO or a partner incentive.
   */
  isPaid: boolean | null;
}

const PAY_INTERVAL_SUFFIX: Record<string, string> = {
  [JOB_PAY_INTERVAL_OPTIONS.PerYear]: "/ yr",
  [JOB_PAY_INTERVAL_OPTIONS.PerMonth]: "/ mo",
  [JOB_PAY_INTERVAL_OPTIONS.PerHour]: "/ hr",
  [JOB_PAY_INTERVAL_OPTIONS.PerEngagement]: "once-off",
};

const toAmount = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/** A Job's disclosed salary from its custom fields; null when undisclosed or amountless. */
function salaryOf(
  opportunity: OpportunityInfo,
  currencies: Currency[],
): MoneyFacts["salary"] {
  const fields = opportunity.customFields ?? [];
  const field = (key: string) => fields.find((f) => f.key === key);
  const K = JOB_CUSTOM_FIELD_KEYS;
  if (field(K.salaryDisclosed)?.value !== "true") return null;
  const from = toAmount(field(K.salaryMinimum)?.value);
  const to = toAmount(field(K.salaryMaximum)?.value);
  if (from === null && to === null) return null;
  const currencyId = field(K.salaryCurrency)?.values?.[0];
  const interval = field(K.payInterval)?.values?.[0];
  return {
    from,
    to,
    currency: currencies.find((c) => c.id === currencyId)?.code ?? "",
    interval: (interval && PAY_INTERVAL_SUFFIX[interval]) ?? "",
  };
}

/** An opportunity's money facts, from its core fields and (for a Job) its salary fields. */
export function moneyFactsOf(
  opportunity: OpportunityInfo,
  currencies: Currency[] = [],
): MoneyFacts {
  const partner =
    opportunity.rewardType === RewardType.PartnerIncentive &&
    opportunity.partnerIncentiveAmount !== null &&
    opportunity.partnerIncentiveCurrency
      ? {
          amount: opportunity.partnerIncentiveAmount,
          currency: opportunity.partnerIncentiveCurrency,
        }
      : null;
  return {
    zltoReward: opportunity.zltoReward,
    salary: salaryOf(opportunity, currencies),
    partnerIncentive: partner,
    isPaid:
      opportunity.incentivized === true &&
      opportunity.rewardType === RewardType.None,
  };
}

export interface MoneyBadgeModel {
  /** The ZLTO pill, independent of the pay line. */
  zlto: number | null;
  /** The pay line, already worded — including "Paid — amount not disclosed". */
  payLine: string | null;
  /** True when the pay line is a partner incentive, so the UI labels it partner-paid. */
  partnerPaid: boolean;
}

export function resolveMoneyBadge(facts: MoneyFacts): MoneyBadgeModel {
  const zlto =
    facts.zltoReward !== null && facts.zltoReward > 0 ? facts.zltoReward : null;

  if (
    facts.salary &&
    (facts.salary.from !== null || facts.salary.to !== null)
  ) {
    const { from, to, currency, interval } = facts.salary;
    const range =
      from !== null && to !== null && from !== to
        ? `${amount(from)}–${amount(to)}`
        : amount(from ?? to ?? 0);
    return {
      zlto,
      payLine: [currency, range, interval].filter(Boolean).join(" "),
      partnerPaid: false,
    };
  }

  if (facts.partnerIncentive)
    return {
      zlto,
      payLine: `${facts.partnerIncentive.currency} ${amount(facts.partnerIncentive.amount)}`,
      partnerPaid: true,
    };

  if (facts.isPaid)
    return { zlto, payLine: "Paid — amount not disclosed", partnerPaid: false };

  return { zlto, payLine: null, partnerPaid: false };
}
