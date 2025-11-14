import { useState, useMemo } from "react";
import {
  IoCheckmarkCircle,
  IoChevronDown,
  IoChevronUp,
  IoPersonAdd,
  IoRocket,
  IoTrophy,
  IoCheckmark,
  IoClose,
  IoEllipseOutline,
  IoArrowForward,
  IoAlertCircle,
  IoArrowUp,
} from "react-icons/io5";
import Link from "next/link";
import type {
  ProgramInfo,
  ReferralLinkUsageInfo,
  ProgramPathwayStepProgress,
  ProgramPathwayTaskProgress,
} from "~/api/models/referrals";
import { ProgramPathwayProgressComponent } from "./ProgramPathwayProgress";

interface RefereeProgressTrackerProps {
  usage: ReferralLinkUsageInfo;
  program: ProgramInfo;
}

// Helper type for next action
export interface NextActionInfo {
  label: string;
  link: string;
  description: string;
  step: {
    name: string;
    order: number;
    description?: string;
    rule: string;
    orderMode: string;
  };
  tasks: Array<{
    id: string;
    opportunityId: string | null;
    opportunityTitle: string;
    completed: boolean;
    isCompletable: boolean;
  }>;
}

// Helper function to determine next action - exported for use in parent
export function getNextAction(
  usage: ReferralLinkUsageInfo,
  program: ProgramInfo,
): NextActionInfo | null {
  // Only provide next action if pathway is required and not yet complete
  if (!program.pathwayRequired || !usage.pathway || usage.pathwayComplete) {
    return null;
  }

  // Find the next incomplete step
  const nextStep = usage.pathway.steps.find((step) => !step.completed);
  if (!nextStep) {
    return null;
  }

  // Get all incomplete tasks from this step
  const incompleteTasks = nextStep.tasks
    .filter((task) => !task.completed && task.isCompletable && task.opportunity)
    .map((task) => ({
      id: task.id,
      opportunityId: task.opportunity?.id || null,
      opportunityTitle: task.opportunity?.title || "Untitled Task",
      completed: task.completed,
      isCompletable: task.isCompletable,
    }));

  if (incompleteTasks.length === 0) {
    return null;
  }

  return {
    label: "View Tasks",
    link: "#next-action",
    description: `Complete the tasks in "${nextStep.name}"`,
    step: {
      name: nextStep.name,
      order: nextStep.orderDisplay,
      description: nextStep.description || undefined,
      rule: nextStep.rule,
      orderMode: nextStep.orderMode,
    },
    tasks: incompleteTasks,
  };
}

export const RefereeProgressTracker: React.FC<RefereeProgressTrackerProps> = ({
  usage,
  program,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Determine current status and next action
  const progressStatus = useMemo(() => {
    // Step 1: Link claimed (always completed if we're here)
    const linkClaimed = true;

    // Step 2: Program requirements
    let requirementsComplete = true;

    // Check Proof of Personhood
    if (
      program.proofOfPersonhoodRequired &&
      !usage.proofOfPersonhoodCompleted
    ) {
      requirementsComplete = false;
    }

    // Check Pathway
    if (program.pathwayRequired && usage.pathway && !usage.pathwayComplete) {
      requirementsComplete = false;
    }

    // Step 3: Rewards
    const rewardsEarned = usage.status === "Completed";

    return {
      linkClaimed,
      requirementsComplete,
      rewardsEarned,
      currentStep: !linkClaimed ? 1 : !requirementsComplete ? 2 : 3,
    };
  }, [usage, program]);

  return (
    <div className="shadow-custom mb-6 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6">
      {/* Header with Toggle */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-white/50">
            <IoRocket className="h-10 w-10 text-blue-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-blue-900">
              Your Journey So Far
            </h2>
            <p className="min-w-0 text-sm leading-relaxed text-gray-800">
              {progressStatus.requirementsComplete
                ? "Track your journey"
                : "Track your progress and see what's next"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn btn-sm gap-1 border-blue-300 bg-transparent text-blue-600 hover:bg-blue-100"
        >
          {isExpanded ? (
            <>
              <IoChevronUp className="h-4 w-4" />
              <span className="text-xs">Hide</span>
            </>
          ) : (
            <>
              <IoChevronDown className="h-4 w-4" />
              <span className="text-xs">Show</span>
            </>
          )}
        </button>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="animate-fade-in">
          {/* Timeline Overview */}
          <div className="flex justify-center md:pt-36">
            <ul className="timeline timeline-vertical timeline-snap-icon max-md:timeline-compact lg:timeline-horizontal">
              {/* Step 1: Link Claimed */}
              <li>
                <div className="timeline-middle">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-4 ${
                      progressStatus.linkClaimed
                        ? "bg-green-600 ring-green-100"
                        : "bg-gray-400 ring-gray-100"
                    }`}
                  >
                    {progressStatus.linkClaimed ? (
                      <IoCheckmarkCircle className="h-6 w-6 text-white" />
                    ) : (
                      <IoPersonAdd className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>
                <div className="timeline-start mb-10 ml-8 md:mb-4 md:ml-0">
                  <div
                    className={`timeline-box group min-h-[120px] border-2 shadow-md transition-all ${
                      progressStatus.linkClaimed
                        ? "border-green-300 bg-gradient-to-br from-green-50 to-white"
                        : "border-gray-300 bg-gradient-to-br from-gray-50 to-white"
                    }`}
                  >
                    <div
                      className={`mb-1 flex items-center gap-2 text-sm font-bold ${
                        progressStatus.linkClaimed
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${
                          progressStatus.linkClaimed
                            ? "bg-green-600"
                            : "bg-gray-400"
                        }`}
                      >
                        {progressStatus.linkClaimed ? (
                          <IoCheckmark className="h-4 w-4" />
                        ) : (
                          "1"
                        )}
                      </span>
                      Step 1
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 md:text-xl">
                      Link Claimed
                    </h3>
                    <p className="text-xs text-gray-600">
                      {progressStatus.linkClaimed
                        ? `Joined ${new Date(usage.dateClaimed).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                        : "Claim your referral link"}
                    </p>
                  </div>
                </div>
                <hr
                  className={
                    progressStatus.linkClaimed ? "bg-green-600" : "bg-gray-400"
                  }
                />
              </li>

              {/* Step 2: Complete Requirements */}
              <li>
                <hr
                  className={
                    progressStatus.requirementsComplete
                      ? "bg-green-600"
                      : progressStatus.currentStep === 2
                        ? "bg-blue-600"
                        : "bg-gray-400"
                  }
                />
                <div className="timeline-middle">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-4 ${
                      progressStatus.requirementsComplete
                        ? "bg-green-600 ring-green-100"
                        : progressStatus.currentStep === 2
                          ? "bg-blue-600 ring-blue-100"
                          : "bg-gray-400 ring-gray-100"
                    }`}
                  >
                    {progressStatus.requirementsComplete ? (
                      <IoCheckmarkCircle className="h-6 w-6 text-white" />
                    ) : (
                      <IoRocket className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>
                <div className="timeline-end mb-10 ml-8 md:mt-4 md:ml-0">
                  <div
                    className={`timeline-box group min-h-[120px] border-2 shadow-md transition-all ${
                      progressStatus.requirementsComplete
                        ? "border-green-300 bg-gradient-to-br from-green-50 to-white"
                        : progressStatus.currentStep === 2
                          ? "border-blue-300 bg-gradient-to-br from-blue-50 to-white"
                          : "border-gray-300 bg-gradient-to-br from-gray-50 to-white"
                    }`}
                  >
                    <div
                      className={`mb-1 flex items-center gap-2 text-sm font-bold ${
                        progressStatus.requirementsComplete
                          ? "text-green-600"
                          : progressStatus.currentStep === 2
                            ? "text-blue-600"
                            : "text-gray-600"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${
                          progressStatus.requirementsComplete
                            ? "bg-green-600"
                            : progressStatus.currentStep === 2
                              ? "bg-blue-600"
                              : "bg-gray-400"
                        }`}
                      >
                        {progressStatus.requirementsComplete ? (
                          <IoCheckmark className="h-4 w-4" />
                        ) : (
                          "2"
                        )}
                      </span>
                      Step 2
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 md:text-xl">
                      Complete Pathway
                    </h3>
                    <p className="text-xs text-gray-600">
                      {progressStatus.requirementsComplete
                        ? "All requirements met!"
                        : program.pathwayRequired && usage.pathway
                          ? `${usage.pathway.stepsCompleted} of ${usage.pathway.stepsTotal} steps completed (${usage.pathway.percentComplete}%)`
                          : "In progress..."}
                    </p>
                    {!progressStatus.requirementsComplete && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-md bg-orange-100 px-2 py-1">
                        <IoArrowUp className="h-3.5 w-3.5 text-orange-600" />
                        <span className="text-xs font-semibold text-orange-700">
                          You are here
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <hr
                  className={
                    progressStatus.requirementsComplete
                      ? "bg-green-600"
                      : progressStatus.currentStep === 2
                        ? "bg-blue-600"
                        : "bg-gray-400"
                  }
                />
              </li>

              {/* Step 3: Earn Rewards */}
              <li>
                <hr
                  className={
                    progressStatus.rewardsEarned
                      ? "bg-green-600"
                      : "bg-gray-400"
                  }
                />
                <div className="timeline-middle">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-4 ${
                      progressStatus.rewardsEarned
                        ? "bg-green-600 ring-green-100"
                        : "bg-gray-400 ring-gray-100"
                    }`}
                  >
                    {progressStatus.rewardsEarned ? (
                      <IoCheckmarkCircle className="h-6 w-6 text-white" />
                    ) : (
                      <IoTrophy className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>
                <div className="timeline-start mb-10 ml-8 md:mb-4 md:ml-0">
                  <div
                    className={`timeline-box group min-h-[120px] border-2 shadow-md transition-all ${
                      progressStatus.rewardsEarned
                        ? "border-green-300 bg-gradient-to-br from-green-50 to-white"
                        : "border-gray-300 bg-gradient-to-br from-gray-50 to-white"
                    }`}
                  >
                    <div
                      className={`mb-1 flex items-center gap-2 text-sm font-bold ${
                        progressStatus.rewardsEarned
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${
                          progressStatus.rewardsEarned
                            ? "bg-green-600"
                            : "bg-gray-400"
                        }`}
                      >
                        {progressStatus.rewardsEarned ? (
                          <IoCheckmark className="h-4 w-4" />
                        ) : (
                          "3"
                        )}
                      </span>
                      Step 3
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 md:text-xl">
                      {program.zltoRewardReferee
                        ? "Earn Rewards!"
                        : "Program Complete!"}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {progressStatus.rewardsEarned
                        ? program.zltoRewardReferee
                          ? `${program.zltoRewardReferee} ZLTO earned!`
                          : "Completed successfully!"
                        : program.zltoRewardReferee
                          ? `Earn ${program.zltoRewardReferee} ZLTO`
                          : "Complete all tasks"}
                    </p>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Toggle Details Button */}
          <div className="flex justify-center border-t-2 border-blue-200 pt-4">
            <button
              type="button"
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              className="btn btn-sm gap-1 border-blue-300 bg-transparent text-blue-600 hover:bg-blue-100"
            >
              {detailsExpanded ? (
                <>
                  <IoChevronUp className="h-4 w-4" />
                  <span className="text-xs">Hide Details</span>
                </>
              ) : (
                <>
                  <IoChevronDown className="h-4 w-4" />
                  <span className="text-xs">Show Details</span>
                </>
              )}
            </button>
          </div>

          {/* Nested Expanded Details */}
          {detailsExpanded && (
            <div className="animate-fade-in mt-6 space-y-4">
              <div className="mb-4 flex items-center gap-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-blue-100">
                  <IoAlertCircle className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    Your Journey Details
                  </h3>
                  <p className="min-w-0 text-sm leading-relaxed text-gray-800">
                    Here's a complete breakdown of your progress so far
                  </p>
                </div>
              </div>
              <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
                <div className="space-y-4">
                  {/* Link Claimed */}
                  <div className="flex items-start gap-3">
                    <IoCheckmarkCircle className="mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900">
                        Link Claimed
                      </h4>
                      <p className="text-sm text-gray-600">
                        Claimed on{" "}
                        {new Date(usage.dateClaimed).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Proof of Person (if required) */}
                  {program.proofOfPersonhoodRequired && (
                    <div className="flex items-start gap-3">
                      <IoCheckmarkCircle className="mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900">
                          Proof of Personhood Completed
                        </h4>
                        <p className="text-sm text-gray-600">
                          Verified via{" "}
                          {usage.proofOfPersonhoodMethod === "OTP"
                            ? "phone number"
                            : "social login"}{" "}
                          during claim
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pathway Progress (if required) */}
                  {program.pathwayRequired && usage.pathway && (
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0">
                        {usage.pathwayComplete ? (
                          <IoCheckmarkCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <IoEllipseOutline className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900">
                          Complete Pathway
                        </h4>
                        <p className="mb-3 text-sm text-gray-600">
                          {usage.pathway.stepsCompleted} of{" "}
                          {usage.pathway.stepsTotal} steps completed (
                          {usage.pathway.percentComplete}%)
                        </p>

                        <div className="-ml-8">
                          <ProgramPathwayProgressComponent
                            pathway={usage.pathway}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Get Rewarded (if applicable) */}
                  {program.zltoRewardReferee && (
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0">
                        {progressStatus.rewardsEarned ? (
                          <IoCheckmarkCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <IoEllipseOutline className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900">
                          Get Rewarded
                        </h4>
                        {progressStatus.rewardsEarned ? (
                          <>
                            <p className="text-sm text-gray-600">
                              {program.zltoRewardReferee} ZLTO earned and added
                              to your wallet!
                            </p>
                            {usage.dateCompleted && (
                              <p className="mt-1 text-xs text-gray-500">
                                Completed on{" "}
                                {new Date(
                                  usage.dateCompleted,
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-600">
                            Complete all requirements to earn{" "}
                            {program.zltoRewardReferee} ZLTO
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
