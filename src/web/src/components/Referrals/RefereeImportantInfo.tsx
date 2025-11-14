import { useRef, useState } from "react";
import { IoChevronDown, IoChevronUp, IoWarning } from "react-icons/io5";
import type { ProgramInfo } from "~/api/models/referrals";

interface RefereeImportantInfoProps {
  program: ProgramInfo;
  isExpanded?: boolean;
}

export const RefereeImportantInfo: React.FC<RefereeImportantInfoProps> = ({
  program,
  isExpanded: initialExpanded = false,
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

  return (
    <div
      ref={containerRef}
      className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-white p-6 shadow-lg"
    >
      {/* Header with Toggle */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-red-900">
            <IoWarning className="h-6 w-6" />
            Important Information Before You Claim
          </h2>
          <p className="text-sm text-gray-700">
            Please read these important requirements and guidelines carefully
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className="btn btn-sm gap-1 border-red-300 bg-transparent text-red-600 hover:bg-red-100"
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
        <div className="animate-fade-in space-y-4">
          {/* New Users Only */}
          <div className="rounded-lg border-2 border-red-200 bg-white p-4">
            <h4 className="mb-2 flex items-center gap-2 font-bold text-red-900">
              <span className="text-lg">🚫</span>
              New Users Only
            </h4>
            <p className="mb-2 text-sm font-semibold text-gray-800">
              This referral program is designed to welcome NEW users to Yoma.
            </p>
            <ul className="ml-6 list-disc space-y-2 text-sm text-gray-700">
              <li>
                <strong>If you're already a Yoma user</strong>, you are{" "}
                <span className="font-bold text-red-700">NOT eligible</span> to
                claim this referral link
              </li>
              <li>
                {program.proofOfPersonhoodRequired ? (
                  <>
                    <strong>If you're new to Yoma</strong>, login with{" "}
                    <strong>Google/Facebook</strong> OR register with a valid{" "}
                    <strong>Phone Number</strong> (South Africa only), then come
                    back to claim this link.
                  </>
                ) : (
                  <>
                    <strong>If you're new to Yoma</strong>, create your account
                    first, then come back to claim this link
                  </>
                )}
              </li>
              {program.proofOfPersonhoodRequired && (
                <li>
                  <strong className="text-red-700">
                    If you sign up with a password
                  </strong>
                  , you are{" "}
                  <span className="font-bold text-red-700">NOT eligible</span>{" "}
                  to claim this referral link
                </li>
              )}
              <li>
                Each person can only claim a referral link <strong>once</strong>{" "}
                - choose carefully!
              </li>
            </ul>
          </div>

          {/* Time Limit */}
          {program.completionWindowInDays ? (
            <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
              <h4 className="mb-2 flex items-center gap-2 font-bold text-yellow-900">
                <span className="text-lg">⏱️</span>
                Time Limit
              </h4>
              <p className="text-sm text-gray-800">
                Once you claim this link, you'll have{" "}
                <strong className="text-yellow-700">
                  {program.completionWindowInDays} days
                </strong>{" "}
                to complete all requirements and earn your rewards.
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-800">
                Make sure you have time to commit before claiming!
              </p>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
              <h4 className="mb-2 flex items-center gap-2 font-bold text-green-900">
                <span className="text-lg">⏱️</span>
                No Time Limit
              </h4>
              <p className="text-sm text-gray-800">
                Complete the requirements at your own pace - there's no time
                limit!
              </p>
            </div>
          )}

          {/* Quick Checklist */}
          <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
            <h4 className="mb-3 flex items-center gap-2 font-bold text-orange-900">
              <span className="text-lg">📋</span>
              Quick Checklist
            </h4>
            <ul className="ml-6 list-disc space-y-2 text-sm text-gray-700">
              <li>
                <strong>Complete all requirements</strong> to earn your rewards
                and help your friend earn theirs
              </li>
              <li>
                <strong>Track your progress</strong> on your dashboard after
                claiming
              </li>
              {program.completionWindowInDays && (
                <li>
                  <strong>Don't delay!</strong> You only have{" "}
                  {program.completionWindowInDays} days to finish everything
                </li>
              )}
              <li>
                <strong>Ask for help</strong> if you get stuck - check the
                program resources or contact support
              </li>
            </ul>
          </div>

          {/* Why This Matters */}
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-xs text-gray-700 italic">
              💡 The referral program helps us grow our community by rewarding
              both you and your friend when you successfully join and
              participate!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
