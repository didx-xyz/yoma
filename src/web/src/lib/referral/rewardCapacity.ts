/**
 * What a referral program can actually award right now, mirroring the server arithmetic exactly.
 *
 * A referral completion is funded from **two** pools, evaluated outside in — Treasury (current
 * financial year) then Program (lifetime) — and the smaller of the two remaining balances is what a
 * single completion may draw. The referee is paid first, the ambassador second, and both payouts may
 * be partial (`LinkUsageService.cs:703-740`, mirrored for display by
 * `ProgramExtensions.CalculateProgramRewardEstimate`).
 *
 * ⚠️ **A null pool means "not enforced", i.e. unlimited — it does not mean "nothing can be awarded".**
 * The server only applies a level's cap when that level has a pool (`ProcessRewardAllocation`,
 * `OpportunityService.cs:2172-2194`, and the `HasValue` guards in the referral path). With no pool at
 * either level, the configured rewards are paid in full, forever. This is the opposite of what an
 * empty pool field reads like, so every surface has to say it out loud.
 *
 * ⚠️ There is **no hard server-side validation** of a program pool against Treasury capacity — the
 * program validator never looks at the Treasury (`ProgramRequestValidator.cs`). Everything here is
 * therefore soft guidance: it explains what will happen, and never blocks a save.
 *
 * Nothing in here formats — callers pass the results through `lib/format/rewards`.
 */

/**
 * The Treasury half of the calculation: the **current-financial-year** ZLTO reward figures, which are
 * zeroed on rollover.
 */
export interface TreasuryZltoCapacity {
  zltoRewardPoolCurrentFinancialYear: number | null;
  zltoRewardBalanceCurrentFinancialYear: number | null;
}

/**
 * The program half: **lifetime** figures, never reset by a financial-year rollover. `zltoRewardBalance`
 * is server-derived (`Program.ZltoRewardBalance` = pool − cumulative) and is `null` when no pool is
 * set — the UI never computes it.
 */
export interface ProgramZltoCapacity {
  zltoRewardReferrer: number | null;
  zltoRewardReferee: number | null;
  zltoRewardPool: number | null;
  zltoRewardBalance: number | null;
}

export type ReferralCapacityStatus =
  /** no pool at either level — rewards are paid in full and are not capped */
  | "unenforced"
  /** a pool applies and nothing is left: the next completion awards 0 */
  | "depleted"
  /** a pool applies and cannot cover the configured rewards in full: payouts will be partial */
  | "constrained"
  /** a pool applies and covers the configured rewards */
  | "healthy";

/** Which level sets the binding cap — the one an admin has to raise to fix it. */
export type ReferralCapacityLimitedBy = "treasury" | "program" | null;

export interface ReferralCapacity {
  status: ReferralCapacityStatus;
  /**
   * ZLTO a single completion may draw right now. `null` when no pool is enforced at either level,
   * which means unlimited — never treat it as zero.
   */
  available: number | null;
  /** referee + ambassador, i.e. what one completion costs at full price; `null` when neither is set */
  target: number | null;
  limitedBy: ReferralCapacityLimitedBy;
}

/** The server clamps every balance at zero before using it as a cap; so do we. */
const atLeastZero = (value: number | null): number => Math.max(value ?? 0, 0);

/**
 * Mirrors `CalculateProgramRewardEstimate` — the same function that produces the
 * `zltoRewardEstimate` figures the API returns, so this never disagrees with them.
 */
export function deriveReferralCapacity(
  program: ProgramZltoCapacity,
  treasury: TreasuryZltoCapacity | null | undefined,
): ReferralCapacity {
  const referee = program.zltoRewardReferee;
  const referrer = program.zltoRewardReferrer;

  const target =
    referee === null && referrer === null
      ? null
      : (referee ?? 0) + (referrer ?? 0);

  // Treasury first: it caps only when the Treasury itself has a pool for this financial year.
  const treasuryApplies =
    !!treasury && treasury.zltoRewardPoolCurrentFinancialYear !== null;
  const treasuryAvailable = treasuryApplies
    ? atLeastZero(treasury!.zltoRewardBalanceCurrentFinancialYear)
    : null;

  const programApplies = program.zltoRewardPool !== null;
  const programAvailable = programApplies
    ? atLeastZero(program.zltoRewardBalance)
    : null;

  let available: number | null = treasuryAvailable;
  let limitedBy: ReferralCapacityLimitedBy = treasuryApplies
    ? "treasury"
    : null;

  if (programAvailable !== null) {
    if (available === null || programAvailable < available) {
      available = programAvailable;
      limitedBy = "program";
    }
    // A tie stays with the Treasury: it is the outer cap, and raising the program pool alone
    // would not move the figure.
  }

  if (available === null) {
    return { status: "unenforced", available: null, target, limitedBy: null };
  }

  if (available <= 0) {
    return { status: "depleted", available, target, limitedBy };
  }

  if (target !== null && available < target) {
    return { status: "constrained", available, target, limitedBy };
  }

  return { status: "healthy", available, target, limitedBy };
}

/**
 * How one side of the reward estimate should read — the API returns what it would pay *now*, and the
 * gap between that and the configured amount is the thing an admin needs to see.
 *
 * Replaces the badge vocabulary that used to live privately in `AdminProgramInfo`; the wording is
 * kept, but it renders as a `RewardStat` note and tone rather than a bespoke badge.
 */
export type RewardEstimateTone = "default" | "warning" | "danger";

export interface RewardEstimateMeta {
  note: string | undefined;
  tone: RewardEstimateTone;
}

export function rewardEstimateMeta(
  configured: number | null | undefined,
  estimate: number | null | undefined,
): RewardEstimateMeta {
  if (configured === null || configured === undefined)
    return { note: "Not configured", tone: "default" };

  if (estimate === null || estimate === undefined)
    return { note: "Estimate unavailable", tone: "default" };

  if (estimate <= 0) return { note: "Pool exhausted", tone: "danger" };

  if (estimate < configured)
    return { note: "Reduced by the available pool", tone: "warning" };

  return { note: undefined, tone: "default" };
}
