import { useMemo, useState } from "react";
import { FaRoad } from "react-icons/fa";
import {
  IoAlert,
  IoAlertCircle,
  IoCheckmark,
  IoCheckmarkCircle,
  IoChevronDown,
  IoChevronUp,
  IoEllipseOutline,
  IoPersonAdd,
  IoPersonCircle,
  IoRocket,
  IoShieldCheckmark,
  IoTrophy,
} from "react-icons/io5";
import type {
  ProgramInfo,
  ReferralLinkUsageInfo,
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
  if (!program.pathwayRequired || !usage.pathway || usage.pathwayCompleted) {
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

  // Generate dynamic steps that match HelpReferee component
  const steps = useMemo(() => {
    const generatedSteps: Array<{
      number: number;
      title: string;
      description: string;
      descriptionLong: string;
      icon: any;
      completed: boolean;
      isCurrentStep: boolean;
    }> = [];
    let stepNumber = 1;
    let currentStepFound = false;

    // Step 1: Register (with or without POP)
    if (program.proofOfPersonhoodRequired) {
      const popCompleted = usage.proofOfPersonhoodCompleted ?? false;
      generatedSteps.push({
        number: stepNumber++,
        title: "Verify Identity",
        description: popCompleted
          ? `Verified via ${usage.proofOfPersonhoodMethod === "OTP" ? "phone" : "social login"} on ${new Date(usage.dateClaimed).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
          : "Verify your identity to continue",
        descriptionLong: popCompleted
          ? `You successfully verified your identity via ${usage.proofOfPersonhoodMethod === "OTP" ? "phone verification (OTP)" : "social login"} on ${new Date(usage.dateClaimed).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. This confirms you are a real person and helps maintain the integrity of the referral program.`
          : "You need to verify your identity to continue with this program. This helps ensure that all participants are real people and maintains the integrity of the referral system. This can be done by signing up with a social login (Google/Facebook) or phone verification (OTP). See your next step below for detailed instructions.",
        icon: IoShieldCheckmark,
        completed: popCompleted,
        isCurrentStep: !popCompleted,
      });
    } else {
      generatedSteps.push({
        number: stepNumber++,
        title: "Register",
        description: `Joined ${new Date(usage.dateClaimed).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        descriptionLong: `You successfully joined this program on ${new Date(usage.dateClaimed).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. Welcome to the community!`,
        icon: IoPersonAdd,
        completed: true, // Always completed at this stage
        isCurrentStep: false,
      });
    }

    // Step 2: Complete Profile - ALWAYS COMPLETED at this stage
    generatedSteps.push({
      number: stepNumber++,
      title: "Complete Profile",
      description: "Profile completed successfully",
      descriptionLong:
        "You have successfully completed your profile. This ensures that we have all the necessary information to provide you with the best experience and track your progress accurately.",
      icon: IoPersonCircle,
      completed: true, // Always completed at this stage
      isCurrentStep: false,
    });

    // Step 3: Complete Pathway (conditional)
    if (program.pathwayRequired) {
      const pathwayCompleted = usage.pathwayCompleted === true;
      generatedSteps.push({
        number: stepNumber++,
        title: "Complete Pathway",
        description: pathwayCompleted
          ? "All pathway steps completed!"
          : usage.pathway
            ? `${usage.pathway.stepsCompleted} of ${usage.pathway.stepsTotal} steps completed (${usage.pathway.percentComplete}%)`
            : "Complete all required steps",
        descriptionLong: pathwayCompleted
          ? "Congratulations! You have successfully completed all the required pathway steps. This is a significant milestone in your journey."
          : usage.pathway
            ? `You have completed ${usage.pathway.stepsCompleted} out of ${usage.pathway.stepsTotal} required steps (${usage.pathway.percentComplete}% complete). Keep going to finish the pathway and unlock your rewards!`
            : "This program requires you to complete all the steps in the learning pathway. Start working through the tasks to make progress.",
        icon: FaRoad,
        completed: pathwayCompleted,
        isCurrentStep: !pathwayCompleted && !currentStepFound,
      });
      if (!pathwayCompleted) {
        currentStepFound = true;
      }
    }

    // Step 4: Earn Rewards or Complete Onboarding
    const allRequirementsMet =
      !program.pathwayRequired || (usage.pathwayCompleted ?? false);
    const rewardsEarned = usage.status === "Completed";

    if (program.zltoRewardReferee && program.zltoRewardReferee > 0) {
      generatedSteps.push({
        number: stepNumber++,
        title: "Earn Rewards",
        description: rewardsEarned
          ? `${program.zltoRewardReferee} ZLTO earned!${usage.dateCompleted ? ` (${new Date(usage.dateCompleted).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})` : ""}`
          : `Earn ${program.zltoRewardReferee} ZLTO`,
        descriptionLong: rewardsEarned
          ? `Fantastic! You have successfully earned ${program.zltoRewardReferee} ZLTO tokens${usage.dateCompleted ? ` on ${new Date(usage.dateCompleted).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}. These tokens have been added to your wallet and can be used within the Yoma ecosystem.`
          : `Complete all the requirements to earn ${program.zltoRewardReferee} ZLTO tokens. These digital tokens can be used to purchase items on the marketplace.`,
        icon: IoTrophy,
        completed: rewardsEarned,
        isCurrentStep:
          !currentStepFound && allRequirementsMet && !rewardsEarned,
      });
    } else {
      generatedSteps.push({
        number: stepNumber++,
        title: "Complete Onboarding",
        description: rewardsEarned
          ? `Completed successfully!${usage.dateCompleted ? ` (${new Date(usage.dateCompleted).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})` : ""}`
          : "Finish all requirements",
        descriptionLong: rewardsEarned
          ? `Congratulations! You have successfully completed the onboarding process${usage.dateCompleted ? ` on ${new Date(usage.dateCompleted).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}. You are now fully set up and ready to explore all the opportunities available to you.`
          : "Complete all the requirements to finish your onboarding. This will unlock full access to all features and opportunities available in this program.",
        icon: IoRocket,
        completed: rewardsEarned,
        isCurrentStep:
          !currentStepFound && allRequirementsMet && !rewardsEarned,
      });
    }

    return generatedSteps;
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
              {steps.every((s) => s.completed)
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
          <div className="flex justify-center lg:pt-36">
            <ul className="timeline timeline-vertical timeline-snap-icon max-md:timeline-compact lg:timeline-horizontal">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isFirst = index === 0;
                const isLast = index === steps.length - 1;
                const prevStep = index > 0 ? steps[index - 1] : null;

                return (
                  <li key={step.number}>
                    {!isFirst && (
                      <hr
                        className={
                          prevStep?.completed ? "bg-green-600" : "bg-gray-400"
                        }
                      />
                    )}
                    <div className="timeline-middle">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-4 ${
                          step.completed
                            ? "bg-green-600 ring-green-100"
                            : step.isCurrentStep
                              ? "bg-orange-500 ring-orange-100"
                              : "bg-gray-400 ring-gray-100"
                        }`}
                      >
                        {step.completed ? (
                          <IoCheckmarkCircle className="h-6 w-6 text-white" />
                        ) : (
                          <Icon className="h-6 w-6 text-white" />
                        )}
                      </div>
                    </div>
                    <div
                      className={`${index % 2 === 0 ? "timeline-start" : "timeline-end"} mb-10 ml-8 ${index % 2 === 0 ? "md:mb-4" : "md:mt-4"} md:ml-0`}
                    >
                      <div
                        className={`timeline-box group min-h-[120px] border-2 shadow-md transition-all ${
                          step.completed
                            ? "border-green-300 bg-gradient-to-br from-green-50 to-white"
                            : step.isCurrentStep
                              ? "border-orange-300 bg-gradient-to-br from-orange-50 to-white"
                              : "border-gray-300 bg-gradient-to-br from-gray-50 to-white"
                        }`}
                      >
                        <div
                          className={`mb-1 flex items-center gap-2 text-sm font-bold ${
                            step.completed
                              ? "text-green-600"
                              : step.isCurrentStep
                                ? "text-orange-600"
                                : "text-gray-600"
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${
                              step.completed
                                ? "bg-green-600"
                                : step.isCurrentStep
                                  ? "bg-orange-500"
                                  : "bg-gray-400"
                            }`}
                          >
                            {step.completed ? (
                              <IoCheckmark className="h-4 w-4" />
                            ) : (
                              step.number
                            )}
                          </span>
                          Step {step.number}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 md:text-xl">
                          {step.title}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {step.description}
                        </p>

                        {step.completed && (
                          <div className="mt-2 flex items-center gap-1.5 rounded-md bg-green-100 px-2 py-1">
                            <IoCheckmark className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">
                              You completed this step
                            </span>
                          </div>
                        )}
                        {step.isCurrentStep && !step.completed && (
                          <div className="mt-2 flex items-center gap-1.5 rounded-md bg-orange-100 px-2 py-1">
                            <IoAlert className="h-3.5 w-3.5 text-orange-600" />
                            <span className="text-xs font-semibold text-orange-700">
                              This step is outstanding
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {!isLast && (
                      <hr
                        className={
                          step.completed ? "bg-green-600" : "bg-gray-400"
                        }
                      />
                    )}
                  </li>
                );
              })}
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
                    Here&apos;s a complete breakdown of your progress so far
                  </p>
                </div>
              </div>
              <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
                <div className="space-y-4">
                  {steps.map((step) => {
                    return (
                      <div key={step.number} className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          {step.completed ? (
                            <IoCheckmarkCircle className="h-6 w-6 text-green-600" />
                          ) : step.isCurrentStep ? (
                            <IoEllipseOutline className="h-6 w-6 text-orange-500" />
                          ) : (
                            <IoEllipseOutline className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900">
                            {step.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {step.descriptionLong}
                          </p>

                          {/* Show pathway details if this is the pathway step and it has data */}
                          {step.title === "Complete Pathway" &&
                            program.pathwayRequired &&
                            usage.pathway && (
                              <div className="mt-3 -ml-8">
                                <ProgramPathwayProgressComponent
                                  pathway={usage.pathway}
                                />
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
