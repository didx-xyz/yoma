import { formatNumber as amount } from "./format";

/**
 * The money-badge precedence — the ONE place the rule lives. Four concepts share the card's
 * money slot; `<MoneyBadge>` renders whatever this resolves and nothing else decides it.
 *
 * ZLTO always keeps its own pill (Yoma pays it); the pay line below is a separate concept:
 *   salary range  >  partner incentive (labelled partner-paid — Yoma processes nothing)
 *                 >  "Paid — amount not disclosed"  >  nothing.
 *
 * Today the core API exposes only `zltoReward`: salary, partner incentive and the is-paid flag
 * live in pending BA-defined opportunity fields (YOM-1264), and nothing may be keyed to a custom
 * field to fake them. The full rule is typed now so the cards never grow a second precedence.
 */

export interface MoneyFacts {
  zltoReward: number | null;
  /** Pending YOM-1264 — a range with ISO currency + pay interval, e.g. R8 000–12 000 / mo. */
  salary: {
    from: number | null;
    to: number | null;
    currency: string;
    interval: string;
  } | null;
  /** Pending YOM-1264 — informational only; Yoma processes nothing. */
  partnerIncentive: { amount: number; currency: string } | null;
  /** Pending YOM-1264. */
  isPaid: boolean | null;
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
