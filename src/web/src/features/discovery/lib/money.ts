import type { OpportunityInfo } from "~/api/models/opportunity";
import { RewardType } from "~/api/models/opportunity";
import { formatNumber as amount } from "./format";

/**
 * The money-badge precedence — the ONE place the rule lives. Four concepts share the card's
 * money slot; `<MoneyBadge>` renders whatever this resolves and nothing else decides it.
 *
 * ZLTO always keeps its own pill (Yoma pays it); the pay line below is a separate concept:
 *   salary range  >  partner incentive (labelled partner-paid — Yoma processes nothing)
 *                 >  "Paid — amount not disclosed"  >  nothing.
 *
 * Fed from the core fields since 2026-09-29 (`moneyFactsOf`): reward type, partner incentive
 * and `incentivized`. Salary is still unfed — it lives in the Job custom fields (lookup-backed
 * currency, option-keyed pay interval), which a card cannot label without the definitions and
 * the currency lookup.
 */

export interface MoneyFacts {
  zltoReward: number | null;
  /** A range with ISO currency + pay interval, e.g. R8 000–12 000 / mo. Not fed yet — see above. */
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

/** An opportunity's money facts, from its core fields. */
export function moneyFactsOf(opportunity: OpportunityInfo): MoneyFacts {
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
    salary: null,
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
      payLine: `${currency} ${range} / ${interval}`,
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
