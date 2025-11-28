import { useQuery } from "@tanstack/react-query";
import { IoStatsChart } from "react-icons/io5";
import type {
  ReferralLink,
  ReferralLinkUsageSearchResults,
} from "~/api/models/referrals";
import {
  getReferralLinkById,
  searchReferralLinkUsagesAsReferrer,
} from "~/api/services/referrals";
import Suspense from "~/components/Common/Suspense";

interface PerformanceOverviewProps {
  link: ReferralLink;
  totalReferrals?: number;
}

export const ReferrerPerformanceOverview: React.FC<
  PerformanceOverviewProps
> = ({ link, totalReferrals: providedTotal }) => {
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
    queryKey: ["ReferralLinkUsage", link?.id, 1],
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

  return (
    <Suspense isLoading={isLoading} error={error as any}>
      <div
      //className="space-y-2 rounded-lg bg-white p-4 md:p-6"
      >
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
          <IoStatsChart className="inline h-5 w-5 text-blue-600 md:h-6 md:w-6" />
          Performance Overview
        </h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          <div className="rounded-lg bg-blue-50 p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">
              {totalReferrals || 0}
            </div>
            <div className="text-gray-dark text-xs">Total Referrals</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <div className="text-2xl font-bold text-green-700">
              {displayLink.completionTotal || 0}
            </div>
            <div className="text-gray-dark text-xs">Completed</div>
          </div>
          <div className="rounded-lg bg-orange-50 p-3 text-center">
            <div className="text-2xl font-bold text-orange-700">
              {displayLink.pendingTotal || 0}
            </div>
            <div className="text-gray-dark text-xs">Pending</div>
          </div>
          <div className="rounded-lg bg-yellow-50 p-3 text-center">
            <div className="text-2xl font-bold text-yellow-700">
              {displayLink.zltoRewardCumulative || 0}
            </div>
            <div className="text-gray-dark text-xs">ZLTO Earned</div>
          </div>
        </div>
      </div>
    </Suspense>
  );
};
