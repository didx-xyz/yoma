import { useQuery } from "@tanstack/react-query";
import {
  ReferralLink,
  ReferralParticipationRole,
} from "~/api/models/referrals";
import { getMyReferralAnalytics } from "~/api/services/referrals";
import Suspense from "~/components/Common/Suspense";
import { LoadingInline } from "../Status/LoadingInline";
import { ReferralStatsLarge } from "./ReferralStatsLarge";

interface ReferrerStatsProps {
  link?: ReferralLink;
}

export const ReferrerStats: React.FC<ReferrerStatsProps> = ({ link }) => {
  const {
    data: analytics,
    isLoading: isLoading,
    error: error,
  } = useQuery({
    queryKey: ["MyReferralAnalytics", ReferralParticipationRole.Referrer],
    queryFn: () => getMyReferralAnalytics(ReferralParticipationRole.Referrer),
    enabled: !link,
  });

  const stats = link
    ? {
        totalReferrals: link?.usageTotal || 0,
        completed: link?.completionTotal || 0,
        pending: link?.pendingTotal || 0,
        zltoEarned: link?.zltoRewardReferrerTotal || 0,
      }
    : {
        totalReferrals: analytics?.usageCountTotal || 0,
        completed: analytics?.usageCountCompleted || 0,
        pending: analytics?.usageCountPending || 0,
        zltoEarned: analytics?.zltoRewardTotal || 0,
      };

  return (
    <Suspense
      isLoading={isLoading}
      error={error as any}
      loader={<LoadingInline classNameSpinner="h-12 border-orange w-12" />}
    >
      <ReferralStatsLarge
        totalReferrals={stats.totalReferrals}
        completed={stats.completed}
        pending={stats.pending}
        zltoEarned={stats.zltoEarned}
      />
    </Suspense>
  );
};
