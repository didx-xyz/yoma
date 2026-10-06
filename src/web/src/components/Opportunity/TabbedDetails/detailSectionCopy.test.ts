import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Currency } from "~/api/models/lookups";
import {
  AccessibilitySupport,
  RewardType,
  type OpportunityInfo,
} from "~/api/models/opportunity";
import type { UserProfilePayout } from "~/api/models/user";
import { moneyFactsOf, type MoneyFacts } from "~/features/discovery/lib/money";
import {
  JOB_CUSTOM_FIELD_KEYS,
  JOB_PAY_INTERVAL_OPTIONS,
} from "~/lib/customFields/customFieldRules";
import {
  accessibilityClosing,
  accessibilityNote,
  ageRangeLabel,
  ageRangeNote,
  cashOutLine,
  incentiveCopy,
  isCashOutClosed,
} from "./detailSectionCopy";

/** formatNumber's thousands separator: a no-break space. */
const NB = " ";

const NO_MONEY: MoneyFacts = {
  zltoReward: null,
  salary: null,
  partnerIncentive: null,
  isPaid: false,
};

type IncentiveFields = Pick<
  OpportunityInfo,
  "incentivized" | "rewardType" | "zltoRewardEstimate"
>;

const copy = (
  fields: Partial<IncentiveFields>,
  options: { isJob?: boolean; facts?: Partial<MoneyFacts> } = {},
) =>
  incentiveCopy(
    {
      incentivized: true,
      rewardType: RewardType.None,
      zltoRewardEstimate: null,
      ...fields,
    },
    {
      isJob: options.isJob ?? false,
      facts: { ...NO_MONEY, ...options.facts },
    },
  );

const NOT_SPECIFIED = {
  kind: "static",
  value: "Not specified",
  note: "The provider hasn't said whether this pays or rewards.",
};

describe("Incentive — which states show", () => {
  test("public: hidden while unanswered with no reward stored", () => {
    assert.equal(copy({ incentivized: null }), null);
    assert.equal(copy({ incentivized: null, rewardType: "Unknown" }), null);
  });

  test("admin: unanswered with no reward stored is a static Not specified row", () => {
    for (const rewardType of [RewardType.None, "Unknown"])
      assert.deepEqual(
        incentiveCopy(
          { incentivized: null, rewardType, zltoRewardEstimate: null },
          { isJob: false, facts: NO_MONEY, showUnspecified: true },
        ),
        NOT_SPECIFIED,
      );
  });

  test("a stored reward with incentivized unanswered reads as rewarded, public and admin", () => {
    for (const showUnspecified of [false, true]) {
      const zlto = (zltoRewardEstimate: number | null) =>
        incentiveCopy(
          {
            incentivized: null,
            rewardType: RewardType.ZLTO,
            zltoRewardEstimate,
          },
          { isJob: false, facts: NO_MONEY, showUnspecified },
        );
      const asTrue = (zltoRewardEstimate: number | null) =>
        copy({ rewardType: RewardType.ZLTO, zltoRewardEstimate });
      for (const estimate of [200, null, 0])
        assert.deepEqual(zlto(estimate), asTrue(estimate));
      const earned = zlto(200);
      assert.equal(earned?.kind === "disclosure" && earned.cashOut, true);

      const partnerFacts = {
        ...NO_MONEY,
        partnerIncentive: { amount: 150, currency: "USD" },
      };
      for (const facts of [partnerFacts, NO_MONEY])
        assert.deepEqual(
          incentiveCopy(
            {
              incentivized: null,
              rewardType: RewardType.PartnerIncentive,
              zltoRewardEstimate: null,
            },
            { isJob: false, facts, showUnspecified },
          ),
          incentiveCopy(
            {
              incentivized: true,
              rewardType: RewardType.PartnerIncentive,
              zltoRewardEstimate: null,
            },
            { isJob: false, facts },
          ),
        );
    }
  });

  test("a Job's disclosed salary with incentivized unanswered reads as its pay line, public and admin", () => {
    const salary = {
      from: 8000,
      to: 12000,
      currency: "ZAR",
      interval: "/ mo",
    };
    for (const showUnspecified of [false, true])
      assert.deepEqual(
        incentiveCopy(
          {
            incentivized: null,
            rewardType: RewardType.None,
            zltoRewardEstimate: null,
          },
          { isJob: true, facts: { ...NO_MONEY, salary }, showUnspecified },
        ),
        {
          kind: "disclosure",
          preview: `ZAR 8${NB}000–12${NB}000 / mo`,
          amount: { text: `ZAR 8${NB}000–12${NB}000 / mo`, zlto: false },
          body: "The pay the employer has shared for this job.",
          cashOut: false,
        },
      );
  });

  test("with nothing stored, an unanswered Job is still hidden publicly and Not specified on admin", () => {
    const unanswered = (showUnspecified: boolean) =>
      incentiveCopy(
        {
          incentivized: null,
          rewardType: RewardType.None,
          zltoRewardEstimate: null,
        },
        { isJob: true, facts: NO_MONEY, showUnspecified },
      );
    assert.equal(unanswered(false), null);
    assert.deepEqual(unanswered(true), NOT_SPECIFIED);
  });

  test("not incentivized is a static None row with its note, whatever else is set", () => {
    const none = {
      kind: "static",
      value: "None",
      note: "No pay, ZLTO or other reward.",
    };
    assert.deepEqual(copy({ incentivized: false }), none);
    assert.deepEqual(
      copy({
        incentivized: false,
        rewardType: RewardType.ZLTO,
        zltoRewardEstimate: 50,
      }),
      none,
    );
  });
});

describe("Incentive — ZLTO", () => {
  test("an estimate: what you earn, the amount line with the icon, then the cash-out line", () => {
    assert.deepEqual(
      copy({ rewardType: RewardType.ZLTO, zltoRewardEstimate: 200 }),
      {
        kind: "disclosure",
        preview: "Earn 200 ZLTO",
        amount: { text: "200 ZLTO", zlto: true },
        body: "An estimate. You earn it once your completion is verified, and you may get less if the reward pool runs low.",
        cashOut: true,
      },
    );
  });

  test("the estimate is grouped as everywhere else", () => {
    const result = copy({
      rewardType: RewardType.ZLTO,
      zltoRewardEstimate: 2473,
    });
    assert.equal(result?.kind, "disclosure");
    if (result?.kind !== "disclosure") return;
    assert.equal(result.preview, `Earn 2${NB}473 ZLTO`);
    assert.deepEqual(result.amount, { text: `2${NB}473 ZLTO`, zlto: true });
  });

  test("no estimate: Earn ZLTO, a ZLTO reward line, and the cash-out line", () => {
    assert.deepEqual(
      copy({ rewardType: RewardType.ZLTO, zltoRewardEstimate: null }),
      {
        kind: "disclosure",
        preview: "Earn ZLTO",
        amount: { text: "ZLTO reward", zlto: true },
        body: "You earn Zlto once your completion is verified. The amount isn't shown for this opportunity.",
        cashOut: true,
      },
    );
  });

  test("depleted (0): says so, with no amount and no cash-out line", () => {
    assert.deepEqual(
      copy({ rewardType: RewardType.ZLTO, zltoRewardEstimate: 0 }),
      {
        kind: "disclosure",
        preview: "ZLTO rewards have run out",
        amount: null,
        body: "This opportunity's ZLTO reward pool has run out, so completing it now earns no Zlto.",
        cashOut: false,
      },
    );
  });
});

describe("Incentive — partner incentive", () => {
  test("with an amount: the badge's own pay line, from the partner", () => {
    assert.deepEqual(
      copy(
        { rewardType: RewardType.PartnerIncentive },
        { facts: { partnerIncentive: { amount: 150, currency: "USD" } } },
      ),
      {
        kind: "disclosure",
        preview: "USD 150 from the partner",
        amount: { text: "USD 150", zlto: false },
        body: "Offered and paid by the partner that runs this opportunity, not by Yoma. Ask them how and when it's paid.",
        cashOut: false,
      },
    );
  });

  test("on a Job with a disclosed salary, still the partner's amount", () => {
    const result = copy(
      { rewardType: RewardType.PartnerIncentive },
      {
        isJob: true,
        facts: {
          partnerIncentive: { amount: 150, currency: "USD" },
          salary: { from: 8000, to: 12000, currency: "ZAR", interval: "/ mo" },
        },
      },
    );
    assert.equal(
      result?.kind === "disclosure" && result.preview,
      "USD 150 from the partner",
    );
  });

  test("without an amount", () => {
    assert.deepEqual(copy({ rewardType: RewardType.PartnerIncentive }), {
      kind: "disclosure",
      preview: "Partner incentive",
      amount: null,
      body: "The partner that runs this opportunity offers an incentive. Ask them for the details — Yoma doesn't pay or process it.",
      cashOut: false,
    });
  });
});

describe("Incentive — paid, reward type None", () => {
  test("a Job with a disclosed salary: the pay line", () => {
    assert.deepEqual(
      copy(
        {},
        {
          isJob: true,
          facts: {
            isPaid: true,
            salary: {
              from: 8000,
              to: 12000,
              currency: "ZAR",
              interval: "/ mo",
            },
          },
        },
      ),
      {
        kind: "disclosure",
        preview: `ZAR 8${NB}000–12${NB}000 / mo`,
        amount: { text: `ZAR 8${NB}000–12${NB}000 / mo`, zlto: false },
        body: "The pay the employer has shared for this job.",
        cashOut: false,
      },
    );
  });

  test("the salary comes from the Job's custom fields, as the header's does", () => {
    const currencies: Currency[] = [
      { id: "cur-zar", code: "ZAR", name: "South African rand" },
    ];
    const job = {
      incentivized: true,
      rewardType: RewardType.None,
      zltoReward: null,
      zltoRewardEstimate: null,
      partnerIncentiveAmount: null,
      partnerIncentiveCurrency: null,
      customFields: [
        { key: JOB_CUSTOM_FIELD_KEYS.salaryDisclosed, value: "true" },
        { key: JOB_CUSTOM_FIELD_KEYS.salaryMinimum, value: "8000" },
        { key: JOB_CUSTOM_FIELD_KEYS.salaryMaximum, value: "12000" },
        { key: JOB_CUSTOM_FIELD_KEYS.salaryCurrency, values: ["cur-zar"] },
        {
          key: JOB_CUSTOM_FIELD_KEYS.payInterval,
          values: [JOB_PAY_INTERVAL_OPTIONS.PerMonth],
        },
      ],
    } as unknown as OpportunityInfo;
    const result = incentiveCopy(job, {
      isJob: true,
      facts: moneyFactsOf(job, currencies),
    });
    assert.equal(
      result?.kind === "disclosure" && result.preview,
      `ZAR 8${NB}000–12${NB}000 / mo`,
    );
  });

  test("a Job with no salary shared: Paid", () => {
    assert.deepEqual(copy({}, { isJob: true, facts: { isPaid: true } }), {
      kind: "disclosure",
      preview: "Paid",
      amount: null,
      body: "This job is paid. The employer hasn't shared the amount.",
      cashOut: false,
    });
  });

  test("not a Job: Paid or rewarded", () => {
    assert.deepEqual(copy({}, { facts: { isPaid: true } }), {
      kind: "disclosure",
      preview: "Paid or rewarded",
      amount: null,
      body: "This opportunity offers pay or a reward. Ask the provider for the details.",
      cashOut: false,
    });
  });
});

describe("Incentive — the cash-out line (C1)", () => {
  const line = (closed: boolean) => {
    const { before, link, after } = cashOutLine(closed);
    return { text: `${before}${link}${after}`, link };
  };

  test("the hedged line, with marketplace as its link", () => {
    assert.deepEqual(line(false), {
      text: "Spend your Zlto in the marketplace, or cash it out for real money in supported countries.",
      link: "marketplace",
    });
  });

  test("Cash Out closed to this youth: the marketplace half only", () => {
    assert.deepEqual(line(true), {
      text: "Spend your Zlto in the marketplace.",
      link: "marketplace",
    });
  });

  const payout = (
    enabled: boolean | undefined,
    supported: boolean | undefined,
  ) =>
    ({
      enabled,
      countryAvailability:
        supported === undefined ? undefined : { supported, offline: false },
    }) as unknown as UserProfilePayout;

  test("an unsupported country closes nothing while the provider is offline", () => {
    const offline = (enabled: boolean) =>
      ({
        enabled,
        countryAvailability: { supported: false, offline: true },
      }) as unknown as UserProfilePayout;
    assert.equal(isCashOutClosed(offline(true)), false);
    assert.equal(isCashOutClosed(offline(false)), true);
  });

  test("closed when the environment is off or the country unsupported", () => {
    assert.equal(isCashOutClosed(payout(false, true)), true);
    assert.equal(isCashOutClosed(payout(true, false)), true);
    assert.equal(isCashOutClosed(payout(false, false)), true);
  });

  test("open when both allow it, signed out, or on an API without the fields", () => {
    assert.equal(isCashOutClosed(payout(true, true)), false);
    assert.equal(isCashOutClosed(null), false);
    assert.equal(isCashOutClosed(undefined), false);
    assert.equal(isCashOutClosed(payout(undefined, undefined)), false);
  });
});

describe("Age range — the label and its note", () => {
  test("from and to", () => {
    assert.equal(ageRangeLabel(21, 27), "21–27 years");
    assert.equal(ageRangeNote(21, 27), "For people aged 21 to 27.");
  });

  test("the same bound twice", () => {
    assert.equal(ageRangeLabel(18, 18), "18 years");
    assert.equal(ageRangeNote(18, 18), "For people aged 18.");
  });

  test("from only", () => {
    assert.equal(ageRangeLabel(18, null), "18 and over");
    assert.equal(ageRangeNote(18, null), "For people aged 18 and over.");
  });

  test("to only", () => {
    assert.equal(ageRangeLabel(null, 35), "Up to 35 years");
    assert.equal(ageRangeNote(null, 35), "For people aged 35 and under.");
  });

  test("neither (or not a number): no row, no note", () => {
    assert.equal(ageRangeLabel(null, undefined), null);
    assert.equal(ageRangeNote(null, undefined), null);
    assert.equal(ageRangeNote(Number.NaN, Number.NaN), null);
    assert.equal(ageRangeNote(Number.NaN, 30), "For people aged 30 and under.");
  });
});

describe("Accessibility — notes and closing lines", () => {
  test("each static value says its own thing", () => {
    assert.equal(
      accessibilityNote(AccessibilitySupport.No),
      "The provider says it offers no accessibility accommodations.",
    );
    assert.equal(
      accessibilityNote(null),
      "The provider hasn't said whether it offers accessibility accommodations.",
    );
    assert.equal(
      accessibilityNote(AccessibilitySupport.AvailableOnRequest),
      "The provider can arrange support if you ask. Ask them what's possible before you start.",
    );
    assert.equal(
      accessibilityNote(AccessibilitySupport.Yes),
      "The provider says it's accessible but hasn't listed how. Ask them before you start.",
    );
  });

  test("a value this client does not know reads as not specified, as its label does", () => {
    assert.equal(
      accessibilityNote("SomethingNew"),
      accessibilityNote(undefined),
    );
  });

  test("the open list closes with what to ask", () => {
    assert.equal(
      accessibilityClosing(AccessibilitySupport.Yes),
      "Need something that isn't listed? Ask the provider before you start.",
    );
    assert.equal(
      accessibilityClosing(AccessibilitySupport.AvailableOnRequest),
      "These aren't in place by default. Ask the provider to arrange what you need before you start.",
    );
    assert.equal(accessibilityClosing(AccessibilitySupport.No), null);
    assert.equal(accessibilityClosing(null), null);
  });
});
