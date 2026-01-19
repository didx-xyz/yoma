import { useMemo } from "react";
import { IoGift, IoTimeOutline } from "react-icons/io5";
import type {
  ProgramInfo,
  ReferralLinkUsageInfo,
} from "~/api/models/referrals";

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

  const statusInfo = useMemo(() => {
    if (usage.status === "Completed") {
      return {
        title: "Program completed",
        message: "Nice work — your progress is saved in your wallet.",
        icon: "🏆",
        tone: "success" as const,
      };
    }

    if (usage.status === "Expired") {
      return {
        title: "Program expired",
        message:
          "The completion window has closed. You can still explore other opportunities.",
        icon: "⏰",
        tone: "warning" as const,
      };
    }

    const percentComplete = usage.percentComplete || 0;

    if (percentComplete === 0) {
      return {
        title: "You're ready to start",
        message: "Complete the next steps below to make progress.",
        icon: "🚀",
        tone: "info" as const,
      };
    }

    if (percentComplete < 90) {
      return {
        title: "You're making progress",
        message: "Keep going — you're on track.",
        icon: "✨",
        tone: "info" as const,
      };
    }

    return {
      title: "Almost there",
      message: "Just a little more to finish.",
      icon: "🏁",
      tone: "info" as const,
    };
  }, [usage.status, usage.percentComplete]);

  const toneStyles = useMemo(() => {
    switch (statusInfo.tone) {
      case "success":
        return {
          iconBg: "bg-green-50",
          iconText: "text-green-700",
        };
      case "warning":
        return {
          iconBg: "bg-orange-50",
          iconText: "text-orange-700",
        };
      default:
        return {
          iconBg: "bg-blue-50",
          iconText: "text-blue-700",
        };
    }
  }, [statusInfo.tone]);

  return (
    <div className="border-base-300 bg-base-100 mb-6 rounded-xl border p-4 shadow-sm md:p-5">
      <div className="flex items-start gap-3 md:gap-4">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md md:h-12 md:w-12 ${toneStyles.iconBg}`}
        >
          <span className={`text-base md:text-lg ${toneStyles.iconText}`}>
            {statusInfo.icon}
          </span>
        </div>

        <div className="min-w-0">
          <h2 className="font-family-nunito text-base-content text-xs font-semibold md:text-sm">
            {statusInfo.title}
          </h2>
          <p className="text-base-content/60 text-[10px] md:text-xs">
            {statusInfo.message}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {usage.status === "Pending" && (
          <div className="bg-base-200 rounded-lg p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-base-content/70 text-[10px] font-semibold md:text-xs">
                Progress
              </span>
              <span className="text-base-content text-xs font-bold md:text-sm">
                {usage.percentComplete ?? 0}%
              </span>
            </div>
            <div className="bg-base-100 h-2 w-full overflow-hidden rounded-full">
              <div
                className="h-full bg-blue-600 transition-all duration-700"
                style={{ width: `${usage.percentComplete ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {usage.status === "Pending" && timeInfo && (
          <div className="bg-base-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="bg-base-100 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md">
                <IoTimeOutline
                  className={`h-4 w-4 ${
                    timeInfo.isExpired
                      ? "text-red-600"
                      : timeInfo.isUrgent
                        ? "text-orange-600"
                        : "text-blue-600"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <div className="text-base-content text-[10px] font-semibold md:text-xs">
                  {timeInfo.isExpired ? "Expired" : "Time remaining"}
                </div>
                <div className="text-base-content/70 text-[10px] md:text-xs">
                  {timeInfo.isExpired
                    ? "—"
                    : `${timeInfo.days} day${timeInfo.days !== 1 ? "s" : ""} • complete by ${timeInfo.expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                </div>
              </div>
            </div>
          </div>
        )}

        {usage.status === "Completed" && usage.dateCompleted && (
          <div className="bg-base-200 rounded-lg p-3">
            <div className="text-base-content text-[10px] font-semibold md:text-xs">
              Completed
            </div>
            <div className="text-base-content/70 text-[10px] md:text-xs">
              {new Date(usage.dateCompleted).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        )}

        {program.zltoRewardReferee && (
          <div className="bg-base-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="bg-base-100 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md">
                <IoGift className="h-4 w-4 text-green-600" />
              </div>
              <div className="min-w-0">
                <div className="text-base-content text-[10px] font-semibold md:text-xs">
                  Reward
                </div>
                <div className="text-base-content/70 text-[10px] md:text-xs">
                  {program.zltoRewardReferee} ZLTO
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
