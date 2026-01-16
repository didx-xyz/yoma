import {
  IoCheckmarkCircle,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoPeople,
  IoTime,
  IoWalletOutline,
} from "react-icons/io5";
import React, { useMemo, useState } from "react";
import type { ProgramInfo } from "~/api/models/referrals";
import { ProgramPathwayView } from "./ProgramPathwayView";

interface ProgramBadgesProps {
  program: ProgramInfo | undefined;
  showToolTips?: boolean;
  mode?: "compact" | "large";
  showPathway?: boolean;
  showBadges?: {
    requirements?: boolean;
    limit?: boolean;
    rewards?: boolean;
    rewardsReferrer?: boolean;
    rewardsReferee?: boolean;
  };
}

const ProgramBadges: React.FC<ProgramBadgesProps> = ({
  program,
  showToolTips = false,
  mode = "compact",
  showPathway = false,
  showBadges,
}) => {
  const [pathwayExpanded, setPathwayExpanded] = useState(false);

  const {
    taskCount,
    completionWindowInDays,
    completionLimitReferee,
    hasPathwayTasks,
    requirementsCompact,
    requirementsLong,
  } = useMemo(() => {
    if (!program) {
      return {
        taskCount: 0,
        completionWindowInDays: 0,
        completionLimitReferee: 0,
        hasPathwayTasks: false,
        requirementsCompact: "No special requirements",
        requirementsLong: null as React.ReactNode,
      };
    }

    let computedTaskCount = 0;

    if (program.pathwayRequired && program.pathway?.steps) {
      computedTaskCount = program.pathway.steps.reduce((total, step) => {
        return total + (step.tasks?.length || 0);
      }, 0);
    }

    const days = program.completionWindowInDays || 0;
    const limit = program.completionLimitReferee || 0;
    const proofRequired = !!program.proofOfPersonhoodRequired;
    const pathwayTasks = computedTaskCount > 0;

    const compactParts: string[] = [];
    if (days > 0) compactParts.push(`${days}d`);
    if (proofRequired) compactParts.push("Personhood");
    if (pathwayTasks) compactParts.push(`Pathway (${computedTaskCount} tasks)`);

    const compact = compactParts.length
      ? compactParts.join(" · ")
      : "No special requirements";

    // Long / readable sentence used for the large mode
    let long: React.ReactNode = null;

    if (days > 0 && (proofRequired || pathwayTasks)) {
      const actions: React.ReactNode[] = [];
      if (proofRequired) actions.push("verify their personhood");
      if (pathwayTasks) {
        actions.push(
          <>
            complete the opportunity pathway (
            <span className="text-base-content font-semibold">
              {computedTaskCount}
            </span>{" "}
            task{computedTaskCount === 1 ? "" : "s"})
          </>,
        );
      }

      const joinedActions = actions.reduce<React.ReactNode[]>(
        (acc, node, idx) => {
          if (idx === 0) return [node];
          return [...acc, " and ", node];
        },
        [],
      );

      long = (
        <>
          People who use your link have{" "}
          <span className="text-base-content font-semibold">{days}</span> day
          {days === 1 ? "" : "s"} to {joinedActions}.
        </>
      );
    } else if (pathwayTasks) {
      long = (
        <>
          People who use your link must complete the opportunity pathway (
          <span className="text-base-content font-semibold">
            {computedTaskCount}
          </span>{" "}
          task{computedTaskCount === 1 ? "" : "s"}).
        </>
      );
    } else if (proofRequired) {
      long = <>People who use your link must verify their personhood.</>;
    } else if (days > 0) {
      long = (
        <>
          People who use your link have{" "}
          <span className="text-base-content font-semibold">{days}</span> day
          {days === 1 ? "" : "s"} to complete the program.
        </>
      );
    }

    return {
      taskCount: computedTaskCount,
      completionWindowInDays: days,
      completionLimitReferee: limit,
      hasPathwayTasks: pathwayTasks,
      requirementsCompact: compact,
      requirementsLong: long,
    };
  }, [program]);

  if (!program) return null;

  const referrerReward = program.zltoRewardReferrer || 0;
  const refereeReward = program.zltoRewardReferee || 0;

  const resolvedShowBadges = {
    requirements: showBadges?.requirements ?? true,
    limit: showBadges?.limit ?? true,
    rewards: showBadges?.rewards ?? true,
    rewardsReferrer: showBadges?.rewardsReferrer ?? true,
    rewardsReferee: showBadges?.rewardsReferee ?? true,
  };

  const rewardsLabelLarge = (() => {
    if (referrerReward === 0 && refereeReward === 0)
      return "This program has no ZLTO rewards.";

    return (
      <>
        {referrerReward > 0 ? (
          <>
            You&apos;ll get{" "}
            <span className="text-base-content font-semibold">
              {referrerReward}
            </span>{" "}
            ZLTO
          </>
        ) : null}

        {referrerReward > 0 && refereeReward > 0 ? " & " : null}

        {refereeReward > 0 ? (
          <>
            they&apos;ll get{" "}
            <span className="text-base-content font-semibold">
              {refereeReward}
            </span>{" "}
            ZLTO
          </>
        ) : null}

        {" once they have completed the program requirements."}
      </>
    );
  })();

  // Back-compat: we no longer show tooltips here.
  void showToolTips;

  if (mode === "large") {
    const rowPadding = "rounded-lg px-4 py-3";
    const iconSize = "h-5 w-5";
    const textSize = "text-xs md:text-xs";
    const rowTextClass = `text-base-content/60 min-w-0 flex-1 ${textSize} leading-snug`;

    return (
      <div className="space-y-2">
        {/* Requirements (combined) */}
        {resolvedShowBadges.requirements ? (
          <div
            className={`bg-base-200 text-base-content/80 flex items-center justify-between gap-2 ${rowPadding}`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {completionWindowInDays > 0 || hasPathwayTasks ? (
                <IoTime
                  className={`text-warning ${iconSize} shrink-0 opacity-70`}
                />
              ) : (
                <IoCheckmarkCircle
                  className={`text-success ${iconSize} shrink-0 opacity-70`}
                />
              )}

              <div className={rowTextClass}>
                {requirementsLong
                  ? requirementsLong
                  : "No special requirements."}
              </div>
            </div>

            {showPathway && program.pathway && taskCount > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPathwayExpanded((prev) => !prev);
                }}
                className="btn btn-sm gap-2 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                {pathwayExpanded ? (
                  <>
                    Hide
                    <IoChevronUpOutline className="h-5 w-5" />
                  </>
                ) : (
                  <>
                    See pathway
                    <IoChevronDownOutline className="h-5 w-5" />
                  </>
                )}
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Limit (kept separate) */}
        {resolvedShowBadges.limit && completionLimitReferee > 0 ? (
          <div
            className={`bg-base-200 text-base-content/80 flex items-center gap-2 ${rowPadding}`}
          >
            <IoPeople
              className={`${iconSize} shrink-0 text-blue-600 opacity-70`}
            />
            <div className={rowTextClass}>
              Up to{" "}
              <span className="text-base-content font-semibold">
                {completionLimitReferee}
              </span>{" "}
              referral{completionLimitReferee === 1 ? "" : "s"} can complete
              this program.
            </div>
          </div>
        ) : null}

        {/* Rewards (combined) */}
        {resolvedShowBadges.rewards ? (
          <div
            className={`bg-base-200 text-base-content/80 flex items-center gap-2 ${rowPadding}`}
          >
            <IoWalletOutline
              className={`${iconSize} shrink-0 text-amber-600 opacity-70`}
            />
            <div className={rowTextClass}>{rewardsLabelLarge}</div>
          </div>
        ) : null}

        {showPathway && pathwayExpanded && program.pathway ? (
          <div className="border-base-300 bg-base-100 rounded-lg border p-3">
            <ProgramPathwayView pathway={program.pathway} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-3 mb-2 space-y-1.5">
      <div className="flex flex-row flex-wrap gap-1">
        {/* Requirements (combined) */}
        {resolvedShowBadges.requirements ? (
          <div className="bg-base-200 text-base-content/80 flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-[11px]">
            {completionWindowInDays > 0 || hasPathwayTasks ? (
              <IoTime className="text-warning h-4 w-4 shrink-0 opacity-70" />
            ) : (
              <IoCheckmarkCircle className="text-success h-4 w-4 shrink-0 opacity-70" />
            )}
            <span className="text-base-content/60 text-[11px] leading-snug">
              {requirementsCompact}
            </span>
          </div>
        ) : null}

        {/* Limit (kept separate) */}
        {resolvedShowBadges.limit && completionLimitReferee > 0 ? (
          <div className="bg-base-200 text-base-content/80 flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-[11px]">
            <IoPeople className="h-4 w-4 shrink-0 text-blue-600 opacity-70" />
            <span className="text-base-content/60 text-[11px] leading-snug">
              Max {completionLimitReferee} referral
              {completionLimitReferee === 1 ? "" : "s"}
            </span>
          </div>
        ) : null}

        {/* Rewards (split in compact mode) */}
        {resolvedShowBadges.rewards ? (
          <>
            {resolvedShowBadges.rewardsReferrer && referrerReward > 0 ? (
              <div className="bg-base-200 text-base-content/80 flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-[11px]">
                <IoWalletOutline className="h-4 w-4 shrink-0 text-amber-600 opacity-70" />
                <span className="text-base-content/60 text-[11px] leading-snug">
                  You get{" "}
                  <span className="text-base-content font-semibold">
                    {referrerReward}
                  </span>{" "}
                  ZLTO
                </span>
              </div>
            ) : null}

            {resolvedShowBadges.rewardsReferee && refereeReward > 0 ? (
              <div className="bg-base-200 text-base-content/80 flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-[11px]">
                <IoWalletOutline className="h-4 w-4 shrink-0 text-amber-600 opacity-70" />
                <span className="text-base-content/60 text-[11px] leading-snug">
                  They get{" "}
                  <span className="text-base-content font-semibold">
                    {refereeReward}
                  </span>{" "}
                  ZLTO
                </span>
              </div>
            ) : null}

            {referrerReward === 0 && refereeReward === 0 ? (
              <div className="bg-base-200 text-base-content/80 flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-[11px]">
                <IoWalletOutline className="h-4 w-4 shrink-0 text-amber-600 opacity-70" />
                <span className="text-base-content/60 text-[11px] leading-snug">
                  No ZLTO rewards
                </span>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ProgramBadges;
