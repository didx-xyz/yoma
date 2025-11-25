import { useMemo } from "react";
import {
  IoClose,
  IoGift,
  IoRocket,
  IoSparkles,
  IoTimeOutline,
  IoTrophy,
} from "react-icons/io5";
import type {
  ProgramInfo,
  ReferralLinkUsageInfo,
} from "~/api/models/referrals";
import { RefereeProgramDetails } from "./RefereeProgramDetails";

interface RefereeStatusBannerProps {
  usage: ReferralLinkUsageInfo;
  program: ProgramInfo;
}

export const RefereeStatusBanner: React.FC<RefereeStatusBannerProps> = ({
  usage,
  program,
}) => {
  // Calculate time remaining
  const timeInfo = useMemo(() => {
    if (!usage.dateClaimed || !program.completionWindowInDays) return null;

    const claimedDate = new Date(usage.dateClaimed);
    const expiryDate = new Date(claimedDate);
    expiryDate.setDate(expiryDate.getDate() + program.completionWindowInDays);

    const now = new Date();
    const remainingMs = expiryDate.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

    return {
      days: remainingDays,
      isUrgent: remainingDays <= 3 && remainingDays > 0,
      isExpired: remainingDays <= 0,
      expiryDate,
    };
  }, [usage.dateClaimed, program.completionWindowInDays]);

  // Determine progression stage and messaging
  const progressionStage = useMemo(() => {
    if (usage.status === "Completed") {
      return {
        title: "You've Done It!",
        subtitle: "Mission Accomplished",
        message: `Congratulations on completing the program! You've shown amazing dedication and skill.`,
        icon: IoTrophy,
        iconColor: "text-yellow-500",
        bgGradient: "from-green-50 via-emerald-50 to-teal-50",
        borderColor: "border-green-400",
        accentColor: "text-green-900",
        showConfetti: true,
      };
    }

    if (usage.status === "Expired") {
      return {
        title: "Time's Up",
        subtitle: "Referral Expired",
        message: `The completion window for the program has closed. But don't worry - there are plenty of other amazing opportunities waiting for you!`,
        icon: IoClose,
        iconColor: "text-red-500",
        bgGradient: "from-red-50 via-orange-50 to-yellow-50",
        borderColor: "border-red-400",
        accentColor: "text-red-900",
        showConfetti: false,
      };
    }

    // Active/Pending status - determine stage based on progress
    const percentComplete = usage.percentComplete || 0;

    if (percentComplete === 0) {
      return {
        title: "Let's Get Started!",
        subtitle: "Your Journey Begins",
        message: `Welcome to the program! You're all set up and ready to begin this exciting journey.`,
        icon: IoRocket,
        iconColor: "text-blue-500",
        bgGradient: "from-blue-50 via-indigo-50 to-purple-50",
        borderColor: "border-blue-400",
        accentColor: "text-blue-900",
        showConfetti: false,
      };
    }

    if (percentComplete < 50) {
      return {
        title: "Great Start!",
        subtitle: "Building Momentum",
        message: `You're making excellent progress. Keep up the fantastic work!`,
        icon: IoSparkles,
        iconColor: "text-purple-500",
        bgGradient: "from-purple-50 via-pink-50 to-rose-50",
        borderColor: "border-purple-400",
        accentColor: "text-purple-900",
        showConfetti: false,
      };
    }

    if (percentComplete < 90) {
      return {
        title: "You're Almost There!",
        subtitle: "So Close Now",
        message: `Amazing work! You're more than halfway through the program. The finish line is in sight!`,
        icon: IoTrophy,
        iconColor: "text-orange-500",
        bgGradient: "from-orange-50 via-amber-50 to-yellow-50",
        borderColor: "border-orange-400",
        accentColor: "text-orange-900",
        showConfetti: false,
      };
    }

    return {
      title: "Final Sprint!",
      subtitle: "Nearly Complete",
      message: `Outstanding! You're ${percentComplete}% done with the program. Just a little more to go!`,
      icon: IoTrophy,
      iconColor: "text-amber-500",
      bgGradient: "from-amber-50 via-yellow-50 to-lime-50",
      borderColor: "border-amber-400",
      accentColor: "text-amber-900",
      showConfetti: false,
    };
  }, [usage.status, usage.percentComplete]);

  const Icon = progressionStage.icon;

  return (
    <div
      className={`shadow-custom relative mb-6 overflow-hidden rounded-xl border-2 ${progressionStage.borderColor} bg-gradient-to-br ${progressionStage.bgGradient} p-6`}
    >
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-black blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-black blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative">
        {/* Header Section */}
        <div className="mb-6 flex items-center gap-6">
          {/* Icon */}
          <div
            className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-white/50 ${progressionStage.showConfetti ? "animate-bounce" : ""}`}
          >
            <Icon className={`h-10 w-10 ${progressionStage.iconColor}`} />
          </div>

          {/* Title & Message */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2
                className={`text-xl font-bold ${progressionStage.accentColor}`}
              >
                {progressionStage.title}
              </h2>
              {progressionStage.showConfetti && (
                <span className="text-xl">🎉</span>
              )}
            </div>

            <p className="text-sm leading-relaxed text-gray-800">
              {progressionStage.message}
            </p>

            {/* Completion Date for Completed Status */}
            {usage.status === "Completed" && usage.dateCompleted && (
              <p className="mt-2 text-xs text-gray-600">
                ✨ Completed on{" "}
                {new Date(usage.dateCompleted).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Program Name Badge */}
        {/* <div className="mb-6">
          <div className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-2 shadow-md ring-2 ring-gray-200">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600">
              <FaRoad className="h-3 w-3 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Program
              </p>
              <p className="text-sm font-bold text-gray-900">{program.name}</p>
            </div>
          </div>
        </div> */}
        <div className="mb-6">
          <RefereeProgramDetails program={program} perspective="referee" />
        </div>

        {/* Progress Bar for Active Status */}
        {usage.status === "Pending" && (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">
                Your Progress
              </span>
              <span className="text-lg font-bold text-gray-900">
                {usage.percentComplete}%
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-white shadow-inner">
              <div
                className={`h-full bg-gradient-to-r transition-all duration-700 ${
                  (usage.percentComplete ?? 0) >= 90
                    ? "from-green-500 via-emerald-500 to-teal-500"
                    : (usage.percentComplete ?? 0) >= 50
                      ? "from-orange-500 via-amber-500 to-yellow-500"
                      : "from-blue-500 via-indigo-500 to-purple-500"
                }`}
                style={{ width: `${usage.percentComplete ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Info Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Time Warning Card */}
          {usage.status === "Pending" && timeInfo && (
            <div
              className={`rounded-xl border-2 bg-white/80 p-4 shadow-md backdrop-blur-sm ${
                timeInfo.isExpired
                  ? "border-red-300"
                  : timeInfo.isUrgent
                    ? "border-yellow-400"
                    : "border-blue-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                    timeInfo.isExpired
                      ? "bg-red-100"
                      : timeInfo.isUrgent
                        ? "bg-yellow-100"
                        : "bg-blue-100"
                  }`}
                >
                  <IoTimeOutline
                    className={`h-5 w-5 ${
                      timeInfo.isExpired
                        ? "text-red-600"
                        : timeInfo.isUrgent
                          ? "text-yellow-700"
                          : "text-blue-600"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p
                    className={`mb-1 text-sm font-semibold ${
                      timeInfo.isExpired
                        ? "text-red-900"
                        : timeInfo.isUrgent
                          ? "text-yellow-900"
                          : "text-blue-900"
                    }`}
                  >
                    {timeInfo.isExpired ? "Expired" : "Time Remaining"}
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      timeInfo.isExpired
                        ? "text-red-700"
                        : timeInfo.isUrgent
                          ? "text-yellow-700"
                          : "text-blue-700"
                    }`}
                  >
                    {timeInfo.isExpired ? (
                      "—"
                    ) : (
                      <>
                        {timeInfo.isUrgent && "⚠️ "}
                        {timeInfo.days} Day{timeInfo.days !== 1 ? "s" : ""}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-600">
                    {timeInfo.isExpired
                      ? "Time limit reached"
                      : `Complete by ${timeInfo.expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rewards Card */}
          {program.zltoRewardReferee && (
            <div
              className={`rounded-xl border-2 bg-white/80 p-4 shadow-md backdrop-blur-sm ${
                usage.status === "Completed"
                  ? "border-green-300"
                  : "border-purple-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                    usage.status === "Completed"
                      ? "bg-green-100"
                      : "bg-purple-100"
                  }`}
                >
                  <IoGift
                    className={`h-5 w-5 ${
                      usage.status === "Completed"
                        ? "text-green-600"
                        : "text-purple-600"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p
                    className={`mb-1 text-sm font-semibold ${
                      usage.status === "Completed"
                        ? "text-green-900"
                        : "text-purple-900"
                    }`}
                  >
                    {usage.status === "Completed"
                      ? "Your Reward"
                      : "Earn Reward"}
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      usage.status === "Completed"
                        ? "text-yellow-700"
                        : "text-purple-700"
                    }`}
                  >
                    {program.zltoRewardReferee} ZLTO
                  </p>
                  <p className="text-xs text-gray-600">
                    {usage.status === "Completed"
                      ? "Added to your wallet"
                      : "Complete all requirements"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
