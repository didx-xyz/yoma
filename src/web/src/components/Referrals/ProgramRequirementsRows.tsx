import React, { useMemo, useState } from "react";
import {
  IoCheckmarkCircle,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoPeople,
  IoTime,
  IoWalletOutline,
} from "react-icons/io5";
import type { ProgramInfo } from "~/api/models/referrals";
import { ProgramPathwayView } from "./ProgramPathwayView";

interface ProgramRequirementsRowsProps {
  program: ProgramInfo;
  showPathway?: boolean;
  variant?: "compact" | "large";
}

export const ProgramRequirementsRows: React.FC<
  ProgramRequirementsRowsProps
> = ({ program, showPathway = false, variant = "compact" }) => {
  const [pathwayExpanded, setPathwayExpanded] = useState(false);

  const {
    requirementsSummary,
    stepCount,
    taskCount,
    completionWindowInDays,
    completionLimitReferee,
    proofOfPersonRequired,
  } = useMemo(() => {
    let computedStepCount = 0;
    let computedTaskCount = 0;

    if (program.pathwayRequired && program.pathway?.steps) {
      computedStepCount = program.pathway.steps.length;
      computedTaskCount = program.pathway.steps.reduce((total, step) => {
        return total + (step.tasks?.length || 0);
      }, 0);
    }

    const hasPathwayTasks = computedTaskCount > 0;
    const proofRequired = !!program.proofOfPersonhoodRequired;

    const taskLabel = `${computedTaskCount} task${computedTaskCount === 1 ? "" : "s"}`;

    let combined: string | null = null;

    if (hasPathwayTasks) {
      if (program.completionWindowInDays) {
        combined = `Users have ${program.completionWindowInDays} day${
          program.completionWindowInDays === 1 ? "" : "s"
        } to complete the opportunity pathway (${taskLabel})`;
      } else {
        combined = `Users must complete the opportunity pathway (${taskLabel})`;
      }
    } else if (program.completionWindowInDays) {
      combined = `Users have ${program.completionWindowInDays} day${
        program.completionWindowInDays === 1 ? "" : "s"
      } to complete the program`;
    }

    if (proofRequired) {
      if (combined) {
        combined = `${combined} and verify their personhood`;
      } else {
        combined = "Users must verify their personhood";
      }
    }

    if (combined) {
      combined = `${combined}.`;
    }

    return {
      requirementsSummary: combined,
      stepCount: computedStepCount,
      taskCount: computedTaskCount,
      completionWindowInDays: program.completionWindowInDays || 0,
      completionLimitReferee: program.completionLimitReferee || 0,
      proofOfPersonRequired: proofRequired,
    };
  }, [
    program.completionLimitReferee,
    program.completionWindowInDays,
    program.pathway?.steps,
    program.pathwayRequired,
    program.proofOfPersonhoodRequired,
  ]);

  const referrerReward = program.zltoRewardReferrer || 0;
  const refereeReward = program.zltoRewardReferee || 0;

  const rowPadding =
    variant === "large" ? "rounded-lg px-4 py-3" : "rounded-md px-3 py-2";
  const iconSize = variant === "large" ? "h-5 w-5" : "h-4 w-4";
  const textSize =
    variant === "large" ? "text-xs md:text-sm" : "text-[10px] md:text-xs";
  const lineHeight = variant === "large" ? "leading-snug" : "leading-snug";

  return (
    <div className="space-y-2">
      <div
        className={`bg-base-200 text-base-content/80 flex items-start justify-between gap-2 ${rowPadding}`}
      >
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <IoCheckmarkCircle
            className={`text-success mt-0.5 ${iconSize} shrink-0 opacity-70`}
          />

          <div
            className={`min-w-0 flex-1 ${textSize} ${lineHeight} text-gray-600`}
          >
            {requirementsSummary ? (
              requirementsSummary
            ) : (
              <>No special requirements.</>
            )}
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
            className={`btn ${variant === "large" ? "btn-sm" : "btn-xs"} gap-2 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100`}
          >
            {pathwayExpanded ? (
              <>
                Hide
                <IoChevronUpOutline
                  className={variant === "large" ? "h-5 w-5" : "h-4 w-4"}
                />
              </>
            ) : (
              <>
                See pathway
                <IoChevronDownOutline
                  className={variant === "large" ? "h-5 w-5" : "h-4 w-4"}
                />
              </>
            )}
          </button>
        ) : null}
      </div>

      {completionLimitReferee ? (
        <div
          className={`bg-base-200 text-base-content/80 flex items-start gap-2 ${rowPadding}`}
        >
          <IoPeople
            className={`mt-0.5 ${iconSize} shrink-0 text-blue-600 opacity-70`}
          />
          <div
            className={`min-w-0 flex-1 ${textSize} ${lineHeight} text-gray-600`}
          >
            Up to{" "}
            <span className="font-semibold text-gray-800">
              {completionLimitReferee}
            </span>{" "}
            referral{completionLimitReferee === 1 ? "" : "s"} can complete this
            program.
          </div>
        </div>
      ) : null}

      <div
        className={`bg-base-200 text-base-content/80 flex items-start gap-2 ${rowPadding}`}
      >
        <IoWalletOutline
          className={`mt-0.5 ${iconSize} shrink-0 text-amber-600 opacity-70`}
        />
        <div
          className={`min-w-0 flex-1 ${textSize} ${lineHeight} text-gray-600`}
        >
          <span className="font-semibold text-gray-800">
            You get {referrerReward} ZLTO
          </span>
          {" · "}
          <span className="font-semibold text-gray-800">
            They get {refereeReward} ZLTO
          </span>
        </div>
      </div>

      {showPathway && pathwayExpanded && program.pathway ? (
        <div className="border-base-300 bg-base-100 rounded-lg border p-3">
          <ProgramPathwayView pathway={program.pathway} />
        </div>
      ) : null}
    </div>
  );
};
