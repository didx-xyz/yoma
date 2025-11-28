import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { IoTrophy } from "react-icons/io5";
import { ReferralParticipationRole } from "~/api/models/referrals";
import { searchReferralAnalytics } from "~/api/services/referrals";
import { userProfileAtom } from "~/lib/store";
import { LoadingInline } from "../Status/LoadingInline";

interface ReferrerLeaderboardProps {
  pageSize?: number;
}

export const ReferrerLeaderboard: React.FC<ReferrerLeaderboardProps> = ({
  pageSize = 10,
}) => {
  const userProfile = useAtomValue(userProfileAtom);

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: [
      "ReferralAnalyticsLeaderboard",
      ReferralParticipationRole.Referrer,
      pageSize,
    ],
    queryFn: () =>
      searchReferralAnalytics({
        role: ReferralParticipationRole.Referrer,
        pageNumber: 1,
        pageSize: pageSize,
      }),
  });

  if (isLoading) {
    return (
      <div className="shadow-custom rounded-lg bg-white p-6">
        <h2 className="mb-4 flex items-center gap-4 text-base font-bold text-gray-900 md:text-lg">
          <IoTrophy className="text-yellow h-6 w-6" /> Top Referrers
        </h2>
        <LoadingInline classNameSpinner="h-12 border-orange w-12" />
      </div>
    );
  }

  // Get current user's display name for highlighting
  const currentUserDisplayName = userProfile?.displayName || "";

  return (
    <div className="shadow-custom rounded-lg bg-white p-6">
      <h2 className="mb-4 flex items-center gap-4 text-base font-bold text-gray-900 md:text-lg">
        <IoTrophy className="text-yellow h-6 w-6" /> Top Referrers
      </h2>

      {!leaderboard?.items || leaderboard.items.length === 0 ? (
        <p className="text-gray-dark text-center text-sm">
          No leaderboard data available yet. Start referring to see your rank!
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {leaderboard.items.map((user, index) => {
              const isCurrentUser =
                user.userDisplayName === currentUserDisplayName;
              const referrals = user.usageCountCompleted ?? 0;

              return (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    isCurrentUser
                      ? "bg-green-light border-green border-2"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-bold text-gray-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {user.userDisplayName}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-gray-600">
                            (You)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600">
                        {referrals} referral{referrals !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="badge bg-yellow text-white">
                      {user.zltoRewardTotal ?? 0} rewarded
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {leaderboard.totalCount > pageSize && (
            <p className="text-gray-dark mt-4 text-center text-xs">
              Showing top {pageSize} of {leaderboard.totalCount} referrers
            </p>
          )}
        </>
      )}
    </div>
  );
};
