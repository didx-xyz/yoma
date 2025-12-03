import { useQuery } from "@tanstack/react-query";
import { ReferralParticipationRole } from "~/api/models/referrals";
import { getMyReferralAnalytics } from "~/api/services/referrals";
import { LoadingInline } from "../Status/LoadingInline";

export const ReferrerStats: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["MyReferralAnalytics", ReferralParticipationRole.Referrer],
    queryFn: () => getMyReferralAnalytics(ReferralParticipationRole.Referrer),
  });

  if (isLoading) {
    return <LoadingInline classNameSpinner="h-12 border-orange w-12" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
        <span className="text-xs text-gray-700">Total Referrals</span>
        <span className="badge bg-blue-600 text-xs text-white">
          {analytics?.usageCountTotal ?? 0}
        </span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-3">
        <span className="text-xs text-gray-700">ZLTO Earned</span>
        <span className="badge bg-yellow-600 text-xs text-white">
          {analytics?.zltoRewardTotal ?? 0}
        </span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
        <span className="text-xs text-gray-700">Completed</span>
        <span className="badge bg-green-600 text-xs text-white">
          {analytics?.usageCountCompleted ?? 0}
        </span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-orange-50 p-3">
        <span className="text-xs text-gray-700">Pending</span>
        <span className="badge bg-orange-600 text-xs text-white">
          {analytics?.usageCountPending ?? 0}
        </span>
      </div>
    </div>
  );
};
