import { useQuery } from "@tanstack/react-query";
import { ReferralParticipationRole } from "~/api/models/referrals";
import { getMyReferralAnalytics } from "~/api/services/referrals";
import Suspense from "~/components/Common/Suspense";
import { LoadingInline } from "../Status/LoadingInline";
import { ReferralStatsLarge } from "./ReferralStatsLarge";

export const ReferrerStats: React.FC = () => {
  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["MyReferralAnalytics", ReferralParticipationRole.Referrer],
    queryFn: () => getMyReferralAnalytics(ReferralParticipationRole.Referrer),
  });

  return (
    <Suspense
      isLoading={isLoading}
      error={error as any}
      loader={<LoadingInline classNameSpinner="h-12 border-orange w-12" />}
    >
      <ReferralStatsLarge
        totalReferrals={analytics?.usageCountTotal || 0}
        completed={analytics?.usageCountCompleted || 0}
        pending={analytics?.usageCountPending || 0}
        zltoEarned={analytics?.zltoRewardTotal || 0}
      />
    </Suspense>
  );
};
