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
import NoRowsMessage from "../NoRowsMessage";

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
      message: `Outstanding! You're almost done with the program. Just a little more to go!`,
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
    <>
      <div className="mb-6 flex items-center justify-center">
        <NoRowsMessage
          icon={
            <Icon
              className={`h-6 w-6 md:h-8 md:w-8 ${progressionStage.iconColor}`}
            />
          }
          title={progressionStage.title}
          //subTitle={progressionStage.subtitle}
          description={progressionStage.message}
          className="max-w-3xl !bg-transparent"
        />
      </div>

      {usage.status === "Completed" && usage.dateCompleted && (
        <div className="mb-6 text-center">
          <p className="text-xs text-gray-500">
            ✨ Completed on{" "}
            {new Date(usage.dateCompleted).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      )}

      {(usage.status === "Pending" || program.zltoRewardReferee) && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Main Content */}
          <div className="relative">
            {/* Progress Bar for Active Status */}
            {usage.status === "Pending" && (
              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">
                    Your Progress
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {usage.percentComplete}%
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-blue-600 transition-all duration-700"
                    style={{ width: `${usage.percentComplete ?? 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Info Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Time Warning Card */}
              {usage.status === "Pending" && timeInfo && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                      <IoTimeOutline className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="mb-1 text-sm font-semibold text-gray-900">
                        {timeInfo.isExpired ? "Expired" : "Time Remaining"}
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {timeInfo.isExpired ? (
                          "—"
                        ) : (
                          <>
                            {timeInfo.isUrgent && "⚠️ "}
                            {timeInfo.days} Day{timeInfo.days !== 1 ? "s" : ""}
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
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
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                      <IoGift className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="mb-1 text-sm font-semibold text-gray-900">
                        {usage.status === "Completed"
                          ? "Your Reward"
                          : "Earn Reward"}
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {program.zltoRewardReferee} ZLTO
                      </p>
                      <p className="text-xs text-gray-500">
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
      )}
    </>
  );
};
