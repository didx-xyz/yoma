import Link from "next/link";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import { formatZlto } from "~/lib/format/rewards";
import {
  deriveReferralCapacity,
  type ProgramZltoCapacity,
  type ReferralCapacityLimitedBy,
  type TreasuryZltoCapacity,
} from "~/lib/referral/rewardCapacity";

/**
 * Soft, non-blocking guidance on what a referral program will actually award.
 *
 * ⚠️ **Soft by necessity, not by choice.** The server never validates a program's reward pool against
 * Treasury capacity (`ProgramRequestValidator.cs` has no Treasury reference), so an admin can save a
 * 10,000,000 ZLTO program pool against an exhausted Treasury and nothing will complain — until
 * completions silently start awarding 0. This notice is the only place that says so. It explains and
 * never blocks: no field error, no disabled submit.
 *
 * ⚠️ Prop-driven — no router, no session, no query — because it renders in three homes: the program
 * detail block, the program edit wizard's Completion & Rewards step, and the Treasury Referrals tab.
 */

const LEVEL_NAME: Record<Exclude<ReferralCapacityLimitedBy, null>, string> = {
  treasury: "the Treasury's ZLTO reward pool for this financial year",
  program: "this programme's ZLTO reward pool",
};

export const ReferralTreasuryCapacityNotice: React.FC<{
  program: ProgramZltoCapacity;
  /** `null` while the Treasury is loading or unavailable — the notice then renders nothing */
  treasury: TreasuryZltoCapacity | null | undefined;
  /** when supplied, the Treasury-capped cases link here (e.g. `/admin/treasury?tab=manage`) */
  treasuryManageHref?: string;
}> = ({ program, treasury, treasuryManageHref }) => {
  const capacity = deriveReferralCapacity(program, treasury);

  // Nothing is configured to be awarded, so there is no capacity story to tell.
  if (capacity.target === null || capacity.target <= 0) return null;

  const manageLink =
    capacity.limitedBy === "treasury" && treasuryManageHref ? (
      <>
        {" "}
        <Link
          href={treasuryManageHref}
          className="text-blue font-semibold underline"
        >
          Manage the Treasury pool
        </Link>
        .
      </>
    ) : null;

  if (capacity.status === "unenforced") {
    return (
      <FormMessage messageType={FormMessageType.Info}>
        <strong>These rewards are not capped by any pool.</strong> Neither this
        programme nor the Treasury has a ZLTO reward pool set, so every
        completion pays the configured {formatZlto(capacity.target)} ZLTO in
        full, with no limit on the total. Set a pool to cap what this programme
        can give away.
      </FormMessage>
    );
  }

  if (capacity.status === "depleted") {
    return (
      <FormMessage messageType={FormMessageType.Error}>
        <strong>
          {capacity.limitedBy === "treasury"
            ? "The Treasury's ZLTO reward pool is exhausted."
            : "This programme's ZLTO reward pool is exhausted."}
        </strong>{" "}
        Completions still count, but they currently award 0 ZLTO to both the
        referee and the ambassador. Increase {LEVEL_NAME[capacity.limitedBy!]}{" "}
        to restore rewards.
        {manageLink}
      </FormMessage>
    );
  }

  if (capacity.status === "constrained") {
    return (
      <FormMessage messageType={FormMessageType.Warning}>
        <strong>The next completion cannot be paid in full.</strong>{" "}
        {formatZlto(capacity.available)} ZLTO is available against the{" "}
        {formatZlto(capacity.target)} ZLTO configured, limited by{" "}
        {LEVEL_NAME[capacity.limitedBy!]}. The referee is paid first and the
        ambassador from whatever remains, so one or both payouts will be
        partial.
        {manageLink}
      </FormMessage>
    );
  }

  return null;
};

export default ReferralTreasuryCapacityNotice;
