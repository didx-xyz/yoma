import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Currency } from "~/api/models/lookups";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { RewardType } from "~/api/models/opportunity";
import {
  JOB_CUSTOM_FIELD_KEYS as K,
  JOB_PAY_INTERVAL_OPTIONS,
} from "~/lib/customFields/customFieldRules";
import { moneyFactsOf, resolveMoneyBadge, type MoneyFacts } from "./money";

const NB = "\u00a0";

const CURRENCIES: Currency[] = [
  { id: "cur-zar", code: "ZAR", name: "South African rand" },
];

const job = (
  customFields: { key: string; value?: string; values?: string[] }[],
  overrides: Partial<OpportunityInfo> = {},
): OpportunityInfo =>
  ({
    incentivized: true,
    rewardType: RewardType.None,
    zltoReward: null,
    partnerIncentiveAmount: null,
    partnerIncentiveCurrency: null,
    customFields,
    ...overrides,
  }) as unknown as OpportunityInfo;

/** A disclosed salary with the given bounds, in ZAR per month unless overridden. */
const salary = (
  minimum: string | null,
  maximum: string | null,
  {
    currency = "cur-zar",
    interval = JOB_PAY_INTERVAL_OPTIONS.PerMonth as string,
  }: { currency?: string; interval?: string } = {},
) =>
  job([
    { key: K.salaryDisclosed, value: "true" },
    ...(minimum !== null ? [{ key: K.salaryMinimum, value: minimum }] : []),
    ...(maximum !== null ? [{ key: K.salaryMaximum, value: maximum }] : []),
    ...(currency ? [{ key: K.salaryCurrency, values: [currency] }] : []),
    ...(interval ? [{ key: K.payInterval, values: [interval] }] : []),
  ]);

const payLine = (opportunity: OpportunityInfo) =>
  resolveMoneyBadge(moneyFactsOf(opportunity, CURRENCIES)).payLine;

describe("The salary pay line names a one-sided bound (2026-10-19)", () => {
  test("a range: both amounts", () => {
    assert.equal(
      payLine(salary("8000", "12000")),
      `ZAR 8${NB}000–12${NB}000 / mo`,
    );
  });

  test("equal bounds: one exact amount", () => {
    assert.equal(payLine(salary("2500", "2500")), `ZAR 2${NB}500 / mo`);
  });

  test("a minimum only: From", () => {
    assert.equal(
      payLine(salary("5000000", null, { interval: "" })),
      `From ZAR 5${NB}000${NB}000`,
    );
  });

  test("a maximum only: Up to", () => {
    assert.equal(
      payLine(salary(null, "400000", { interval: "" })),
      `Up to ZAR 400${NB}000`,
    );
  });

  test("the interval is appended only when supplied", () => {
    assert.equal(payLine(salary("5000", null)), `From ZAR 5${NB}000 / mo`);
    assert.equal(
      payLine(
        salary(null, "50", { interval: JOB_PAY_INTERVAL_OPTIONS.PerHour }),
      ),
      "Up to ZAR 50 / hr",
    );
  });

  test("an unlabelled currency is left out, never guessed", () => {
    assert.equal(
      payLine(salary("5000", null, { currency: "cur-unknown" })),
      `From 5${NB}000 / mo`,
    );
    assert.equal(
      payLine(salary(null, "5000", { currency: "" })),
      `Up to 5${NB}000 / mo`,
    );
  });

  test("decimals keep their point", () => {
    assert.equal(payLine(salary("150.5", null)), "From ZAR 150.5 / mo");
  });

  test("a non-positive bound counts as missing", () => {
    assert.equal(payLine(salary("0", "9000")), `Up to ZAR 9${NB}000 / mo`);
  });
});

describe("The money precedence is unchanged", () => {
  test("an undisclosed salary falls through to Paid — amount not disclosed", () => {
    assert.equal(
      payLine(job([{ key: K.salaryDisclosed, value: "false" }])),
      "Paid — amount not disclosed",
    );
  });

  test("a disclosed salary with no amount falls through as well", () => {
    assert.equal(
      payLine(job([{ key: K.salaryDisclosed, value: "true" }])),
      "Paid — amount not disclosed",
    );
  });

  test("a partner incentive is partner-paid", () => {
    const model = resolveMoneyBadge(
      moneyFactsOf(
        job([], {
          rewardType: RewardType.PartnerIncentive,
          partnerIncentiveAmount: 300,
          partnerIncentiveCurrency: "USD",
        }),
      ),
    );
    assert.deepEqual(model, {
      zlto: null,
      payLine: "USD 300",
      partnerPaid: true,
    });
  });

  test("ZLTO keeps its own pill beside a one-sided salary", () => {
    const facts: MoneyFacts = {
      zltoReward: 50,
      salary: { from: 5000, to: null, currency: "ZAR", interval: "" },
      partnerIncentive: null,
      isPaid: true,
    };
    assert.deepEqual(resolveMoneyBadge(facts), {
      zlto: 50,
      payLine: `From ZAR 5${NB}000`,
      partnerPaid: false,
    });
  });
});
