import { useQuery } from "@tanstack/react-query";
import type {
  ReferralLink,
  ReferralLinkUsageSearchResults,
} from "~/api/models/referrals";
import {
  getReferralLinkById,
  searchReferralLinkUsagesAsReferrer,
} from "~/api/services/referrals";
import Suspense from "~/components/Common/Suspense";
import { LoadingInline } from "../Status/LoadingInline";
import { ReferralStatsSmall } from "./ReferralStatsSmall";
import { ReferralStatsLarge } from "./ReferralStatsLarge";

interface PerformanceOverviewProps {
  link: ReferralLink;
  totalReferrals?: number;
  mode?: "small" | "large";
}

export const ReferrerPerformanceOverview: React.FC<
  PerformanceOverviewProps
> = ({ link, totalReferrals: providedTotal, mode = "large" }) => {
  // Fetch full link details
  const {
    data: fullLinkData,
    isLoading: linkLoading,
    error: linkError,
  } = useQuery<ReferralLink>({
    queryKey: ["ReferralLinkDetail", link?.id, "withQR"],
    queryFn: () => getReferralLinkById(link?.id ?? "", true),
    enabled: !!link?.id,
  });

  // Fetch usage data to get total count
  const {
    data: usageData,
    isLoading: usageLoading,
    error: usageError,
  } = useQuery<ReferralLinkUsageSearchResults>({
    queryKey: ["ReferralLinkUsage", link?.id, 1, 1],
    queryFn: () =>
      searchReferralLinkUsagesAsReferrer({
        linkId: link?.id ?? "",
        programId: null,
        statuses: null,
        dateStart: null,
        dateEnd: null,
        pageNumber: 1,
        pageSize: 1,
      }),
    enabled: !!link?.id,
  });

  const isLoading = linkLoading || usageLoading;
  const error = linkError || usageError;
  const totalReferrals = providedTotal ?? usageData?.totalCount ?? 0;
  const displayLink = fullLinkData || link;

  if (mode === "small") {
    return (
      <Suspense
        isLoading={isLoading}
        error={error as any}
        loader={<LoadingInline classNameSpinner="h-12 border-orange w-12" />}
      >
        <ReferralStatsSmall
          totalReferrals={totalReferrals}
          completed={displayLink.completionTotal || 0}
          pending={displayLink.pendingTotal || 0}
          zltoEarned={displayLink.zltoRewardCumulative || 0}
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
      <ReferralStatsLarge
        totalReferrals={totalReferrals}
        completed={displayLink.completionTotal || 0}
        pending={displayLink.pendingTotal || 0}
        zltoEarned={displayLink.zltoRewardCumulative || 0}
      />
    </Suspense>
  );
};
