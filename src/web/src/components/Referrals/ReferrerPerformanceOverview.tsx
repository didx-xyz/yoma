import { useQuery } from "@tanstack/react-query";
import type { ReferralLink } from "~/api/models/referrals";
import { getReferralLinkById } from "~/api/services/referrals";
import Suspense from "~/components/Common/Suspense";
import { LoadingInline } from "../Status/LoadingInline";
import { withMockReferralStats } from "~/lib/referrals/referralStatsMock";
import { ReferralStatsSmall } from "./ReferralStatsSmall";

interface PerformanceOverviewProps {
  link: ReferralLink;
  mode?: "small" | "large";
  showDescriptions?: boolean;
}

export const ReferrerPerformanceOverview: React.FC<
  PerformanceOverviewProps
> = ({ link, mode = "large", showDescriptions }) => {
  // Fetch full link details
  const {
    data: fullLinkData,
    isLoading: isLoading,
    error: error,
  } = useQuery<ReferralLink>({
    queryKey: ["ReferralLinkDetail", link?.id, "withQR"],
    queryFn: () => getReferralLinkById(link?.id ?? "", true),
    enabled: !!link?.id,
  });

  const displayLink = fullLinkData || link;

  const stats = withMockReferralStats(
    {
      totalReferrals: displayLink.usageTotal || 0,
      completed: displayLink.completionTotal || 0,
      pending: displayLink.pendingTotal || 0,
      zltoEarned: displayLink.zltoRewardCumulative || 0,
    },
    "link",
  );

  const effectiveShowDescriptions = showDescriptions ?? mode === "large";

  if (mode === "small") {
    return (
      <Suspense
        isLoading={isLoading}
        error={error as any}
        loader={<LoadingInline classNameSpinner="h-12 border-orange w-12" />}
      >
        <ReferralStatsSmall
          totalReferrals={stats.totalReferrals}
          completed={stats.completed}
          pending={stats.pending}
          zltoEarned={stats.zltoEarned}
          showDescriptions={effectiveShowDescriptions}
        />
      </Suspense>
    );
  }

  return (
    <Suspense
      isLoading={isLoading}
      error={error as any}
      loader={<LoadingInline classNameSpinner="h-12 border-orange w-12" />}
    >
      <ReferralStatsSmall
        totalReferrals={stats.totalReferrals}
        completed={stats.completed}
        pending={stats.pending}
        zltoEarned={stats.zltoEarned}
        showDescriptions={effectiveShowDescriptions}
      />
    </Suspense>
  );
};
