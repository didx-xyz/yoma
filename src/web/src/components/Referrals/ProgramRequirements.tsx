import { useState } from "react";
import {
  IoCheckmarkCircle,
  IoChevronDown,
  IoChevronUp,
  IoShieldCheckmark,
  IoTrophy,
  IoGiftOutline,
} from "react-icons/io5";
import type { ProgramInfo } from "~/api/models/referrals";
import { ProgramPathwayView } from "./ProgramPathwayView";

interface ProgramRequirementsProps {
  program: ProgramInfo;
  className?: string;
  showPathway?: boolean;
}

export const ProgramRequirements: React.FC<ProgramRequirementsProps> = ({
  program,
  className = "",
  showPathway = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate requirements
  const requirements: string[] = [];
  if (program.proofOfPersonhoodRequired) {
    requirements.push("Proof of Person verification");
  }

  let stepCount = 0;
  let taskCount = 0;
  if (program.pathwayRequired && program.pathway?.steps) {
    stepCount = program.pathway.steps.length;
    taskCount = program.pathway.steps.reduce((total, step) => {
      return total + (step.tasks?.length || 0);
    }, 0);
    if (taskCount > 0) {
      requirements.push("Pathway Completion");
    }
  }

  // Calculate rewards
  const referrerReward = program.zltoRewardReferrer || 0;
  const refereeReward = program.zltoRewardReferee || 0;

  return (
    <div className={className}>
      {/* Summary */}
      <div className="space-y-3 rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
        {/* Requirements Summary */}
        {requirements.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-white p-3 shadow-sm">
            <IoCheckmarkCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Users must complete:{" "}
                {requirements.map((req, index) => (
                  <span key={req}>
                    <span className="font-bold text-blue-700">{req}</span>
                    {index < requirements.length - 1 && " and "}
                  </span>
                ))}
              </p>
            </div>
          </div>
        )}

        {/* Pathway Summary */}
        {taskCount > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-white p-3 shadow-sm">
            <IoTrophy className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Pathway includes{" "}
                <span className="font-bold text-orange-700">{stepCount}</span>{" "}
                step
                {stepCount > 1 ? "s" : ""} with{" "}
                <span className="font-bold text-orange-700">{taskCount}</span>{" "}
                task
                {taskCount > 1 ? "s" : ""} total
              </p>
            </div>
          </div>
        )}

        {/* Rewards Summary */}
        <div className="flex items-start gap-2 rounded-lg bg-white p-3 shadow-sm">
          <IoGiftOutline className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              {referrerReward > 0 && refereeReward > 0 ? (
                <>
                  You earn{" "}
                  <span className="font-bold text-green-700">
                    {referrerReward} ZLTO
                  </span>
                  , they earn{" "}
                  <span className="font-bold text-green-700">
                    {refereeReward} ZLTO
                  </span>
                </>
              ) : referrerReward > 0 ? (
                <>
                  You earn{" "}
                  <span className="font-bold text-green-700">
                    {referrerReward} ZLTO
                  </span>
                  , they earn{" "}
                  <span className="font-bold text-gray-500">nothing</span>
                </>
              ) : refereeReward > 0 ? (
                <>
                  You earn{" "}
                  <span className="font-bold text-gray-500">nothing</span>, they
                  earn{" "}
                  <span className="font-bold text-green-700">
                    {refereeReward} ZLTO
                  </span>
                </>
              ) : (
                <span className="font-bold text-gray-500">
                  No ZLTO rewards available
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Toggle Button */}
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }}
            className="btn btn-sm gap-1 border-orange-300 bg-transparent text-orange-600 hover:bg-orange-100"
          >
            {isExpanded ? (
              <>
                <IoChevronUp className="h-4 w-4" />
                <span className="text-xs">Hide</span>
              </>
            ) : (
              <>
                <IoChevronDown className="h-4 w-4" />
                <span className="text-xs">Details</span>
              </>
            )}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-4 border-t-2 border-orange-200 pt-4">
            {/* Proof of Personhood Details */}
            {program.proofOfPersonhoodRequired && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-900">
                  <IoCheckmarkCircle className="h-4 w-4" />
                  Proof of Person
                </h4>
                <p className="text-xs text-blue-800">
                  Users must verify their identity to ensure they are a real
                  person before they can complete this program. This helps
                  prevent fraud and ensures fair participation.
                </p>
              </div>
            )}

            {/* Pathway Details */}
            {showPathway && program.pathwayRequired && program.pathway && (
              <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-900">
                  <IoTrophy className="h-4 w-4" />
                  Pathway Completion
                </h4>
                <p className="mb-3 text-xs text-blue-800">
                  Users must complete the below pathway by following the steps
                  and tasks in the order specified. Each step contains
                  opportunities that need to be completed before moving forward.
                </p>
                <div className="mb-3 border-t border-blue-200"></div>
                <ProgramPathwayView pathway={program.pathway} />
              </div>
            )}

            {/* Rewards Details */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-green-900">
                <IoGiftOutline className="h-4 w-4" />
                ZLTO Rewards Breakdown
              </h4>
              <div className="space-y-2 text-xs text-green-800">
                <div className="flex items-center justify-between">
                  <span>Your reward (referrer):</span>
                  <span className="font-bold">
                    {referrerReward > 0 ? `${referrerReward} ZLTO` : "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Their reward (referee):</span>
                  <span className="font-bold">
                    {refereeReward > 0 ? `${refereeReward} ZLTO` : "None"}
                  </span>
                </div>
                {(referrerReward > 0 || refereeReward > 0) && (
                  <div className="mt-2 border-t border-green-300 pt-2">
                    <p className="text-xs italic">
                      💡 Rewards are paid when the referee successfully
                      completes all program requirements
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
