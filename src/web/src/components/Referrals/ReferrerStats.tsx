import { useQuery } from "@tanstack/react-query";
import { IoStatsChart } from "react-icons/io5";
import { getMyReferralAnalytics } from "~/api/services/referrals";
import { LoadingInline } from "../Status/LoadingInline";
import { ReferralParticipationRole } from "~/api/models/referrals";

export const ReferrerStats: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["MyReferralAnalytics", ReferralParticipationRole.Referrer],
    queryFn: () => getMyReferralAnalytics(ReferralParticipationRole.Referrer),
  });

  if (isLoading) {
    return (
      <div className="shadow-custom rounded-lg bg-white p-6">
        <h2 className="mb-4 flex items-center gap-4 text-lg font-bold text-gray-900">
          <IoStatsChart className="text-green h-6 w-6" /> Your Stats
        </h2>
        <LoadingInline classNameSpinner="h-12 border-orange w-12" />
      </div>
    );
  }

  return (
    <div className="shadow-custom rounded-lg bg-white p-6">
      <h2 className="mb-4 flex items-center gap-4 text-lg font-bold text-gray-900">
        <IoStatsChart className="text-green h-6 w-6" /> Your Stats
      </h2>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
          <span className="text-sm text-gray-700">Total Referrals</span>
          <span className="badge bg-blue-600 text-white">
            {analytics?.usageCountTotal ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-3">
          <span className="text-sm text-gray-700">ZLTO Earned</span>
          <span className="badge bg-yellow-600 text-white">
            {analytics?.zltoRewardTotal ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
          <span className="text-sm text-gray-700">Completed</span>
          <span className="badge bg-green-600 text-white">
            {analytics?.usageCountCompleted ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-orange-50 p-3">
          <span className="text-sm text-gray-700">Pending</span>
          <span className="badge bg-orange-600 text-white">
            {analytics?.usageCountPending ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
};
