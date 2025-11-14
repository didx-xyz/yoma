import { useState } from "react";
import {
  IoCheckmarkCircle,
  IoChevronDown,
  IoChevronUp,
  IoInformationCircleOutline,
  IoPersonAdd,
  IoRocket,
  IoTrophy,
} from "react-icons/io5";

interface HelpRefereeProps {
  isExpanded?: boolean;
}

export const HelpReferee: React.FC<HelpRefereeProps> = ({
  isExpanded = true,
}) => {
  const [howItWorksExpanded, setHowItWorksExpanded] = useState(isExpanded);
  const [howItWorksDetailsExpanded, setHowItWorksDetailsExpanded] =
    useState(false);

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg">
      {/* Header with Toggle */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-blue-900">
            <IoInformationCircleOutline className="h-6 w-6" />
            How It Works
          </h2>
          <p className="text-sm text-gray-700">
            Learn what you need to do to complete the program and earn rewards
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHowItWorksExpanded(!howItWorksExpanded)}
          className="btn btn-sm gap-1 border-blue-300 bg-transparent text-blue-600 hover:bg-blue-100"
        >
          {howItWorksExpanded ? (
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
      {howItWorksExpanded && (
        <div className="animate-fade-in">
          {/* Timeline Overview */}
          <div className="flex justify-center md:pt-36">
            <ul className="timeline timeline-vertical timeline-snap-icon max-md:timeline-compact lg:timeline-horizontal">
              {/* Step 1 */}
              <li>
                <div className="timeline-middle">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 shadow-lg ring-4 ring-blue-100">
                    <IoPersonAdd className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="timeline-start mb-10 ml-8 md:mb-4 md:ml-0">
                  <div className="timeline-box group min-h-[120px] border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-md transition-all hover:shadow-lg">
                    <div className="mb-1 flex items-center gap-2 text-sm font-bold text-blue-600">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                        1
                      </span>
                      Step 1
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 md:text-xl">
                      Claim Link
                    </h3>
                    <p className="text-xs text-gray-600">
                      Click the button below to join the program
                    </p>
                  </div>
                </div>
                <hr className="bg-blue-600" />
              </li>

              {/* Step 2 */}
              <li>
                <hr className="bg-green" />
                <div className="timeline-middle">
                  <div className="bg-green flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-4 ring-green-100">
                    <IoRocket className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="timeline-end mb-10 ml-8 md:mt-4 md:ml-0">
                  <div className="timeline-box border-green group min-h-[120px] border-2 bg-gradient-to-br from-green-50 to-white shadow-md transition-all hover:shadow-lg">
                    <div className="text-green mb-1 flex items-center gap-2 text-sm font-bold">
                      <span className="bg-green flex h-6 w-6 items-center justify-center rounded-full text-xs text-white">
                        2
                      </span>
                      Step 2
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 md:text-xl">
                      Complete Program
                    </h3>
                    <p className="text-xs text-gray-600">
                      Verify identity and complete pathway tasks
                    </p>
                  </div>
                </div>
                <hr className="bg-green" />
              </li>

              {/* Step 3 */}
              <li>
                <hr className="bg-yellow-600" />
                <div className="timeline-middle">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-600 shadow-lg ring-4 ring-yellow-100">
                    <IoTrophy className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="timeline-start mb-10 ml-8 md:mb-4 md:ml-0">
                  <div className="timeline-box group min-h-[120px] border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white shadow-md transition-all hover:shadow-lg">
                    <div className="mb-1 flex items-center gap-2 text-sm font-bold text-yellow-600">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-600 text-xs text-white">
                        3
                      </span>
                      Step 3
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 md:text-xl">
                      Earn Rewards!
                    </h3>
                    <p className="text-xs text-gray-600">
                      Both you and your friend earn ZLTO
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
              onClick={() =>
                setHowItWorksDetailsExpanded(!howItWorksDetailsExpanded)
              }
              className="btn btn-sm gap-1 border-blue-300 bg-transparent text-blue-600 hover:bg-blue-100"
            >
              {howItWorksDetailsExpanded ? (
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

          {/* Nested Expanded Details */}
          {howItWorksDetailsExpanded && (
            <div className="animate-fade-in mt-6 space-y-6">
              {/* Detailed Steps */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Step 1 Detailed */}
                <div className="group rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 transition-all hover:shadow-lg">
                  <div className="mb-2 flex flex-row items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-md">
                      1
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Claim Link
                    </h3>
                  </div>
                  <p className="text-gray-dark mb-3 text-sm leading-relaxed">
                    Click the button below to join the program. You&apos;ll need
                    to sign in or create an account if you don&apos;t have one
                    yet. This connects you to your friend who invited you.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                    <IoCheckmarkCircle className="h-4 w-4" />
                    <span>Simple Sign Up</span>
                  </div>
                </div>

                {/* Step 2 Detailed */}
                <div className="group rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-6 transition-all hover:shadow-lg">
                  <div className="mb-2 flex flex-row items-center gap-4">
                    <div className="bg-green flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white shadow-md">
                      2
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Complete Program
                    </h3>
                  </div>
                  <p className="text-gray-dark mb-3 text-sm leading-relaxed">
                    Follow the program steps: verify your identity if required,
                    and complete any pathway tasks. Track your progress on your
                    dashboard to see how close you are to finishing.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
                    <IoCheckmarkCircle className="h-4 w-4" />
                    <span>Track Your Progress</span>
                  </div>
                </div>

                {/* Step 3 Detailed */}
                <div className="group rounded-xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-6 transition-all hover:shadow-lg">
                  <div className="mb-2 flex flex-row items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-600 text-2xl text-white shadow-md">
                      3
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Earn Rewards!
                    </h3>{" "}
                  </div>
                  <p className="text-gray-dark mb-3 text-sm leading-relaxed">
                    Once you complete all requirements, you&apos;ll receive your
                    ZLTO rewards! Your friend who referred you will also earn
                    rewards. It&apos;s a win-win for both of you!
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-yellow-700">
                    <IoCheckmarkCircle className="h-4 w-4" />
                    <span>Mutual Rewards</span>
                  </div>
                </div>
              </div>

              {/* Important Info */}
              <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-purple-900">
                  <span className="text-2xl">💡</span>
                  Important Things to Know
                </h3>
                <ul className="ml-6 list-disc space-y-2 text-sm text-gray-800">
                  <li>
                    <strong>New Users Only:</strong> This program is designed
                    for people who are new to Yoma. If you already have an
                    account, you may not be eligible.
                  </li>
                  <li>
                    <strong>One Claim Per Person:</strong> You can only claim
                    one referral link. Choose carefully!
                  </li>
                  <li>
                    <strong>Complete Requirements:</strong> Both you and your
                    referrer only get rewards when you complete all program
                    requirements.
                  </li>
                  <li>
                    <strong>Time Limits:</strong> Some programs have deadlines.
                    Check the program details to see how long you have to
                    complete everything.
                  </li>
                </ul>
              </div>

              {/* Bottom Toggle Button */}
              <div className="flex justify-center border-t-2 border-blue-200 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setHowItWorksExpanded(!howItWorksDetailsExpanded)
                  }
                  className="btn btn-sm gap-1 border-blue-300 bg-transparent text-blue-600 hover:bg-blue-100"
                >
                  <IoChevronUp className="h-4 w-4" />
                  <span className="text-xs">Hide</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
