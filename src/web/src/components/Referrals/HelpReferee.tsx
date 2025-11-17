import { useState, useMemo } from "react";
import {
  IoCheckmarkCircle,
  IoChevronDown,
  IoChevronUp,
  IoInformationCircleOutline,
  IoPersonAdd,
  IoRocket,
  IoTrophy,
  IoPersonCircle,
  IoShieldCheckmark,
} from "react-icons/io5";
import { FaRoad } from "react-icons/fa";
import type { ProgramInfo } from "~/api/models/referrals";

interface HelpRefereeProps {
  isExpanded?: boolean;
  program?: ProgramInfo;
}

interface Step {
  number: number;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  icon: any;
  color: {
    ring: string;
    bg: string;
    border: string;
    badge: string;
    text: string;
    bgGradient: string;
  };
  badge: string;
}

export const HelpReferee: React.FC<HelpRefereeProps> = ({
  isExpanded = true,
  program,
}) => {
  const [howItWorksExpanded, setHowItWorksExpanded] = useState(isExpanded);
  const [howItWorksDetailsExpanded, setHowItWorksDetailsExpanded] =
    useState(false);

  // Generate dynamic steps based on program configuration
  const steps = useMemo<Step[]>(() => {
    const generatedSteps: Step[] = [];
    let stepNumber = 1;

    // Step 1: Register (with or without proof-of-personhood)
    if (program?.proofOfPersonhoodRequired) {
      generatedSteps.push({
        number: stepNumber++,
        title: "Register & Verify",
        shortDescription: "Sign up with Google/Facebook or Phone",
        detailedDescription:
          "Click the claim button to get started. You'll need to verify your identity by signing in with Google/Facebook or registering with your phone number. This proof-of-personhood step ensures you're a real person and helps prevent fraud.",
        icon: IoShieldCheckmark,
        color: {
          ring: "ring-blue-100",
          bg: "bg-blue-600",
          border: "border-blue-200",
          badge: "bg-blue-600",
          text: "text-blue-600",
          bgGradient: "from-blue-50 to-white",
        },
        badge: "Required",
      });
    } else {
      generatedSteps.push({
        number: stepNumber++,
        title: "Register",
        shortDescription: "Create your Yoma account",
        detailedDescription:
          "Click the claim button to get started. You'll create a Yoma account to begin your journey. The registration process is quick and straightforward.",
        icon: IoPersonAdd,
        color: {
          ring: "ring-blue-100",
          bg: "bg-blue-600",
          border: "border-blue-200",
          badge: "bg-blue-600",
          text: "text-blue-600",
          bgGradient: "from-blue-50 to-white",
        },
        badge: "Required",
      });
    }

    // Step 2: Complete Profile (always required)
    generatedSteps.push({
      number: stepNumber++,
      title: "Complete Profile",
      shortDescription: "Update your YoID profile information",
      detailedDescription:
        "After registering or signing in, you'll need to complete your YoID profile. This includes filling in personal information, updating your settings, and optionally adding a profile photo. A complete profile helps you get the most out of Yoma.",
      icon: IoPersonCircle,
      color: {
        ring: "ring-purple-100",
        bg: "bg-purple-600",
        border: "border-purple-200",
        badge: "bg-purple-600",
        text: "text-purple-600",
        bgGradient: "from-purple-50 to-white",
      },
      badge: "Required",
    });

    // Step 3: Complete Pathway (conditional)
    if (program?.pathwayRequired) {
      generatedSteps.push({
        number: stepNumber++,
        title: "Complete Pathway",
        shortDescription: "Finish all required steps and tasks",
        detailedDescription:
          "This program requires you to complete a pathway—a series of steps and tasks like learning modules, workshops, or community projects. Track your progress on your dashboard to see how close you are to finishing.",
        icon: FaRoad,
        color: {
          ring: "ring-green-100",
          bg: "bg-green",
          border: "border-green-200",
          badge: "bg-green",
          text: "text-green",
          bgGradient: "from-green-50 to-white",
        },
        badge: "Required",
      });
    }

    // Step 4: Earn Rewards or Achievements (always shown, but conditional content)
    if (program?.zltoRewardReferee && program.zltoRewardReferee > 0) {
      generatedSteps.push({
        number: stepNumber++,
        title: "Earn ZLTO Rewards",
        shortDescription: `Receive ${program.zltoRewardReferee} ZLTO tokens`,
        detailedDescription: `Once you complete all requirements, you'll earn ${program.zltoRewardReferee} ZLTO rewards! Your friend who referred you will also earn rewards—it's a win-win for both of you!`,
        icon: IoTrophy,
        color: {
          ring: "ring-yellow-100",
          bg: "bg-yellow-600",
          border: "border-yellow-200",
          badge: "bg-yellow-600",
          text: "text-yellow-600",
          bgGradient: "from-yellow-50 to-white",
        },
        badge: "Reward",
      });
    } else {
      generatedSteps.push({
        number: stepNumber++,
        title: "Complete Onboarding",
        shortDescription: "Finish onboarding to get started",
        detailedDescription:
          "Once you complete all requirements, you'll successfully complete your onboarding journey and be ready to explore all the opportunities and features Yoma has to offer.",
        icon: IoRocket,
        color: {
          ring: "ring-orange-100",
          bg: "bg-orange-600",
          border: "border-orange-200",
          badge: "bg-orange-600",
          text: "text-orange-600",
          bgGradient: "from-orange-50 to-white",
        },
        badge: "Achievement",
      });
    }

    return generatedSteps;
  }, [program]);

  // If no program, show generic fallback
  const displaySteps = program
    ? steps
    : [
        {
          number: 1,
          title: "Sign Up & Set Profile",
          shortDescription: "Register and complete your YoID profile",
          detailedDescription:
            "Create your account and complete your profile information.",
          icon: IoPersonCircle,
          color: {
            ring: "ring-blue-100",
            bg: "bg-blue-600",
            border: "border-blue-200",
            badge: "bg-blue-600",
            text: "text-blue-600",
            bgGradient: "from-blue-50 to-white",
          },
          badge: "Required",
        },
        {
          number: 2,
          title: "Complete Requirements",
          shortDescription: "Finish program requirements",
          detailedDescription: "Complete any required steps and activities.",
          icon: FaRoad,
          color: {
            ring: "ring-green-100",
            bg: "bg-green",
            border: "border-green-200",
            badge: "bg-green",
            text: "text-green",
            bgGradient: "from-green-50 to-white",
          },
          badge: "Required",
        },
        {
          number: 3,
          title: "Earn & Grow",
          shortDescription: "Receive rewards or achievements",
          detailedDescription:
            "Complete the program to earn rewards or achievements.",
          icon: IoTrophy,
          color: {
            ring: "ring-yellow-100",
            bg: "bg-yellow-600",
            border: "border-yellow-200",
            badge: "bg-yellow-600",
            text: "text-yellow-600",
            bgGradient: "from-yellow-50 to-white",
          },
          badge: "Reward",
        },
      ];

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg">
      {/* Header with Toggle */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-blue-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 shadow-sm">
              <IoInformationCircleOutline className="h-5 w-5 text-blue-600" />
            </div>
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
              {displaySteps.map((step, index) => {
                const Icon = step.icon;
                const isLast = index === displaySteps.length - 1;
                const isFirst = index === 0;

                return (
                  <li key={step.number}>
                    {!isFirst && <hr className={step.color.bg} />}
                    <div className="timeline-middle">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${step.color.bg} shadow-lg ring-4 ${step.color.ring}`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div
                      className={`${index % 2 === 0 ? "timeline-start" : "timeline-end"} mb-10 ml-8 ${index % 2 === 0 ? "md:mb-4" : "md:mt-4"} md:ml-0`}
                    >
                      <div
                        className={`timeline-box group min-h-[140px] max-w-[220px] border-2 ${step.color.border} bg-gradient-to-br ${step.color.bgGradient} shadow-md transition-all hover:shadow-lg`}
                      >
                        <div
                          className={`mb-2 flex items-center gap-2 text-sm font-bold ${step.color.text}`}
                        >
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full ${step.color.badge} text-xs text-white`}
                          >
                            {step.number}
                          </span>
                          Step {step.number}
                        </div>
                        <h3 className="text-sm leading-tight font-bold text-gray-900">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-gray-600">
                          {step.shortDescription}
                        </p>
                      </div>
                    </div>
                    {!isLast && (
                      <hr className={displaySteps[index + 1]?.color.bg} />
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
              <div className="space-y-3">
                {displaySteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.number}
                      className={`group rounded-lg border-2 ${step.color.border} bg-gradient-to-br ${step.color.bgGradient} p-4 transition-all hover:shadow-lg`}
                    >
                      <div className="mb-2 flex flex-row items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${step.color.badge} text-lg text-white shadow-md`}
                        >
                          {step.number}
                        </div>
                        <h3 className="text-base font-bold text-gray-900">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-gray-dark mb-2 text-sm leading-relaxed">
                        {step.detailedDescription}
                      </p>
                      <div
                        className={`flex items-center gap-2 text-xs font-semibold ${step.color.text}`}
                      >
                        <IoCheckmarkCircle className="h-4 w-4" />
                        <span>{step.badge}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Important Info */}
              {/* <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-purple-900">
                  <span className="text-2xl">💡</span>
                  Program Requirements Explained
                </h3>
                <p className="mb-4 text-sm text-gray-800">
                  Each referral program can have different requirements. Here's
                  what you need to know:
                </p>
                <ul className="ml-6 list-disc space-y-3 text-sm text-gray-800">
                  <li>
                    <strong>Proof-of-Personhood (Conditional):</strong> Some
                    programs require identity verification through
                    Google/Facebook sign-in or phone registration to ensure real
                    people are participating and prevent abuse.
                  </li>
                  <li>
                    <strong>YoID Profile (Always Required):</strong> You must
                    complete your profile with personal information and
                    settings. This helps Yoma tailor opportunities to your
                    interests and goals.
                  </li>
                  <li>
                    <strong>Pathway Completion (Conditional):</strong> If the
                    program has a pathway, you&apos;ll need to complete all
                    steps and tasks. These can range from quick activities to
                    more in-depth learning experiences.
                  </li>
                  <li>
                    <strong>ZLTO Rewards (Conditional):</strong> Not all
                    programs offer ZLTO rewards. Some focus on skill-building
                    and achievements instead. Check the program details to see
                    what&apos;s offered!
                  </li>
                  <li>
                    <strong>Time Limits:</strong> Some programs have completion
                    windows. Make sure to check the deadline and complete all
                    requirements in time.
                  </li>
                  <li>
                    <strong>One Claim Per Person:</strong> You can only claim
                    one referral link per program. Choose carefully and make
                    sure you can complete the requirements!
                  </li>
                </ul>
              </div> */}

              {/* Key Info Cards */}
              {/* <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-bold text-orange-900">
                    <span className="text-xl">⚠️</span>
                    New Users Only
                  </h4>
                  <p className="text-sm text-gray-800">
                    Most referral programs are designed for people who are new
                    to Yoma. If you already have an account and have completed
                    certain activities, you may not be eligible for all
                    programs.
                  </p>
                </div>
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-bold text-blue-900">
                    <span className="text-xl">⏱️</span>
                    Track Your Progress
                  </h4>
                  <p className="text-sm text-gray-800">
                    Once you claim a link, you can track your progress in
                    real-time on your dashboard. You&apos;ll see exactly what
                    steps remain and how close you are to completion.
                  </p>
                </div>
              </div> */}

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
