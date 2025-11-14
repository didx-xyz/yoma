import { useRef, useState } from "react";
import {
  IoCheckmarkCircle,
  IoChevronDown,
  IoChevronUp,
  IoClipboardOutline,
  IoFingerPrintOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import type { ProgramInfo } from "~/api/models/referrals";
import { ProgramPathwayView } from "./ProgramPathwayView";

interface RefereeRequirementsProps {
  program: ProgramInfo;
  isExpanded?: boolean;
}

export const RefereeRequirements: React.FC<RefereeRequirementsProps> = ({
  program,
  isExpanded: initialExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (isExpanded) {
      setIsExpanded(false);
      setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } else {
      setIsExpanded(true);
    }
  };

  const hasProofOfPersonhood = program.proofOfPersonhoodRequired;
  const hasPathway = program.pathwayRequired && program.pathway;
  const requirementsCount =
    (hasProofOfPersonhood ? 1 : 0) + (hasPathway ? 1 : 0);

  return (
    <div
      ref={containerRef}
      className="rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 shadow-lg"
    >
      {/* Header with Toggle */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-orange-900">
            <IoClipboardOutline className="h-6 w-6" />
            What You Need to Do
          </h2>
          <p className="text-sm text-gray-700">
            {requirementsCount === 0
              ? "Review the steps to complete this program"
              : `Complete ${requirementsCount} requirement${requirementsCount > 1 ? "s" : ""} to earn your rewards`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
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
              <span className="text-xs">Show</span>
            </>
          )}
        </button>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="animate-fade-in space-y-6">
          {/* Requirements Overview */}
          <div className="space-y-4">
            {/* Proof of Personhood */}
            {hasProofOfPersonhood && (
              <div className="group rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 transition-all hover:shadow-md">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 shadow-md">
                    <IoFingerPrintOutline className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">
                      Prove You're a Real Person
                    </h4>
                    <p className="text-xs text-gray-600">
                      Required to prevent fraud and ensure fair rewards
                    </p>
                  </div>
                  <IoCheckmarkCircle className="h-6 w-6 text-gray-300" />
                </div>
                <div className="ml-13 space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>How to do it:</strong>
                  </p>
                  <ul className="ml-5 list-disc space-y-1">
                    <li>Login with Google or Facebook</li>
                    <li>
                      Register with a valid Phone Number (South Africa only)
                    </li>
                  </ul>
                  <div className="mt-2">
                    <p>
                      <strong>Why it's needed:</strong>
                    </p>
                    <ul className="ml-5 list-disc space-y-1">
                      <li>
                        This protects the program from abuse and ensures
                        everyone gets fair rewards.
                      </li>
                    </ul>
                  </div>
                  <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs">
                      <strong>💡 Tip:</strong> Choose whichever verification
                      method is most convenient for you.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pathway */}
            {hasPathway && program.pathway && (
              <div className="group rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-4 transition-all hover:shadow-md">
                <div className="mb-3 flex items-center gap-3">
                  <div className="bg-green flex h-10 w-10 items-center justify-center rounded-full shadow-md">
                    <IoShieldCheckmarkOutline className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">
                      Complete Learning Pathway
                    </h4>
                    <p className="text-xs text-gray-800">
                      Complete the activities and tasks in this learning
                      pathway.
                    </p>
                  </div>
                  <IoCheckmarkCircle className="h-6 w-6 text-gray-300" />
                </div>
                <div className="ml-13 space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>How to complete:</strong>
                  </p>
                  <ul className="ml-5 list-disc space-y-1">
                    <li>
                      Some tasks require uploading proof of completion (photos,
                      documents, etc.)
                    </li>
                    <li>
                      Your submissions may be subject to review and verification
                    </li>
                    <li>
                      You'll be notified at each stage of the verification
                      process
                    </li>
                    <li>
                      Monitor your progress in the dashboard to track your
                      completion status
                    </li>
                  </ul>
                  <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-3">
                    <p className="text-xs">
                      <strong>💡 Tip:</strong> Take your time to learn and
                      complete each step. The skills you gain are valuable!
                    </p>
                  </div>
                  <ProgramPathwayView pathway={program.pathway} />
                </div>
              </div>
            )}

            {/* No Requirements */}
            {requirementsCount === 0 && (
              <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6 text-center">
                <IoCheckmarkCircle className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p className="text-gray-600">
                  No specific requirements! Just claim the link to participate
                  in this program.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
