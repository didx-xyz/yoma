import { useQuery } from "@tanstack/react-query";
import {
  IoCheckmarkCircle,
  IoGift,
  IoPeople,
  IoStatsChart,
  IoTime,
} from "react-icons/io5";
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

  if (mode === "small") {
    return (
      <Suspense
        isLoading={isLoading}
        error={error as any}
        loader={<LoadingInline classNameSpinner="h-12 border-orange w-12" />}
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Total */}
          <div className="flex min-w-0 items-center gap-2 font-bold text-blue-700">
            <span className="badge gap-1 truncate bg-blue-50 text-blue-700">
              <IoPeople />
              {(totalReferrals || 0).toLocaleString()}
            </span>
            <div className="min-w-0 flex-1 truncate text-[10px] font-normal text-gray-500">
              Total
            </div>
          </div>

          {/* Completed */}
          <div className="flex min-w-0 items-center gap-2 font-bold text-green-700">
            <span className="badge gap-1 truncate bg-green-50 text-green-700">
              <IoCheckmarkCircle />
              {(displayLink.completionTotal || 0).toLocaleString()}
            </span>
            <div className="min-w-0 flex-1 truncate text-[10px] font-normal text-gray-500">
              Completed
            </div>
          </div>

          {/* Pending */}
          <div className="flex min-w-0 items-center gap-2 font-bold text-orange-700">
            <span className="badge gap-1 truncate bg-orange-50 text-orange-700">
              <IoTime />
              {(displayLink.pendingTotal || 0).toLocaleString()}
            </span>
            <div className="min-w-0 flex-1 truncate text-[10px] font-normal text-gray-500">
              Pending
            </div>
          </div>

          {/* ZLTO Earned */}
          <div className="flex min-w-0 items-center gap-2 font-bold text-yellow-700">
            <span className="badge gap-1 truncate bg-yellow-50 text-yellow-700">
              <IoGift />
              {(displayLink.zltoRewardCumulative || 0).toLocaleString()}
            </span>
            <div className="min-w-0 flex-1 truncate text-[10px] font-normal text-gray-500">
              ZLTO Earned
            </div>
          </div>
        </div>
      </Suspense>
    );
  }

  return (
    <Suspense isLoading={isLoading} error={error as any}>
      <div>
        <div className="grid grid-cols-2 gap-1">
          <div className="min-w-0">
            <div className="text-gray-dark trunate mt-1 text-xs md:text-sm">
              Total Referrals
            </div>
            <div className="flex items-center gap-1 font-bold text-black">
              <IoPeople className="mr-1 text-base text-blue-700" />
              <span className="font-family-nunito truncate text-lg">
                {(totalReferrals || 0).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-gray-dark trunate mt-1 text-xs md:text-sm">
              Completed
            </div>
            <div className="flex items-center gap-1 font-bold text-black">
              <IoCheckmarkCircle className="mr-1 text-base text-green-700" />
              <span className="font-family-nunito truncate text-lg">
                {(displayLink.completionTotal || 0).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-gray-dark trunate mt-1 text-xs md:text-sm">
              Pending
            </div>
            <div className="flex items-center gap-1 font-bold text-black">
              <IoTime className="mr-1 text-base text-orange-700" />
              <span className="font-family-nunito truncate text-lg">
                {(displayLink.pendingTotal || 0).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-gray-dark trunate mt-1 text-xs md:text-sm">
              ZLTO Earned
            </div>
            <div className="flex items-center gap-1 font-bold text-black">
              <IoGift className="mr-1 text-base text-yellow-700" />
              <span className="font-family-nunito truncate text-lg">
                {(displayLink.zltoRewardCumulative || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
};
