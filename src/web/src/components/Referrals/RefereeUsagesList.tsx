import { IoChevronDown } from "react-icons/io5";
import type { ReferralLinkUsage } from "~/api/models/referrals";
import { ReferralLinkUsageStatus } from "~/api/models/referrals";
import { searchReferralLinkUsagesAsReferee } from "~/api/services/referrals";
import Suspense from "~/components/Common/Suspense";
import NoRowsMessage from "~/components/NoRowsMessage";
import { usePaginatedQuery } from "~/hooks/usePaginatedQuery";
import Link from "next/link";
import { FaChartBar } from "react-icons/fa";
import Image from "next/image";
import Moment from "react-moment";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";

interface RefereeUsagesListProps {
  initialPageSize?: number;
}

const RefereeUsageRow = ({ usage }: { usage: ReferralLinkUsage }) => {
  const statusLabel = usage.status;
  return (
    <div className="flex w-full items-center justify-between gap-3 py-4 select-none">
      <div className="flex max-w-full min-w-0 flex-1 flex-col items-start gap-3 md:flex-row md:items-center md:gap-6">
        {/* HEADER & PROGRESS */}
        <div className="flex w-full min-w-0 flex-1 flex-col gap-1">
          <Link
            href={`/referrals/progress/${usage.programId}`}
            className="font-family-nunito text-base-content block min-w-0 overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap transition-opacity hover:opacity-75 md:text-sm"
          >
            {usage.programName}
          </Link>
        </div>

        {/* DATE & STATUS */}
        <div className="md:flex-colx flex shrink-0 flex-row items-start gap-2 md:items-center md:justify-center md:px-4">
          <span className="text-base-content/70 text-xs">
            <Moment format={DATE_FORMAT_HUMAN} utc={true}>
              {usage.dateCreated}
            </Moment>
          </span>
          <div className="flex items-center gap-2">
            {usage.status === "Completed" ? (
              <Image
                src="/images/icon-referral-stats-completed.svg"
                alt="Completed"
                width={14}
                height={14}
                className="shrink-0"
              />
            ) : usage.status === "Pending" ? (
              <Image
                src="/images/icon-referral-stats-pending.svg"
                alt="Pending"
                width={14}
                height={14}
                className="shrink-0"
              />
            ) : (
              <Image
                src="/images/icon-referral-stats-expired.svg"
                alt="Status"
                width={11}
                height={11}
                className="shrink-0"
              />
            )}
            <span className="text-base-content/70 text-xs font-bold">
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* BUTTON */}
      <Link
        href={`/referrals/progress/${usage.programId}`}
        className="btn btn-sm bg-orange btn-circle shrink-0 gap-2 p-0 px-1 text-white hover:brightness-110 md:w-auto md:rounded-lg md:px-4"
      >
        <FaChartBar className="h-3 w-3" />
        <span className="hidden md:block">Track Progress</span>
      </Link>
    </div>
  );
};

export const RefereeUsagesList: React.FC<RefereeUsagesListProps> = ({
  initialPageSize = 5,
}) => {
  const {
    items: usages,
    error,
    isLoading,
    isFetching,
    hasMore,
    loadMore,
  } = usePaginatedQuery<ReferralLinkUsage>({
    queryKey: ["ReferralLinkUsagesReferee"],
    queryFn: async (pageNumber, pageSize) => {
      const result = await searchReferralLinkUsagesAsReferee({
        pageNumber,
        pageSize,
        linkId: null,
        programId: null,
        statuses: [
          ReferralLinkUsageStatus.Pending,
          ReferralLinkUsageStatus.Expired,
        ],
        dateStart: null,
        dateEnd: null,
      });
      return {
        items: result.items || [],
        totalCount: result.totalCount || 0,
      };
    },
    pageSize: initialPageSize,
  });

  const hasUsages = usages.length > 0;

  return (
    <Suspense
      isLoading={isLoading && !hasUsages}
      error={error as any}
      loader={
        <div className="animate-pulse space-y-4">
          <div className="bg-base-200 h-16 w-full rounded"></div>
          <div className="bg-base-200 h-16 w-full rounded"></div>
        </div>
      }
    >
      {!hasUsages ? (
        <NoRowsMessage
          title="No referrals yet"
          description="Join a program to start earning rewards."
        />
      ) : (
        <div className="space-y-2">
          <div className="border-base-300 bg-base-100 divide-y divide-gray-300 overflow-visible rounded-lg border px-4">
            {usages.map((usage: ReferralLinkUsage) => (
              <RefereeUsageRow key={usage.id} usage={usage} />
            ))}
          </div>

          {/* See More Button */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={isFetching}
                className="btn btn-outline border-orange btn-sm text-orange hover:bg-orange disabled:!border-orange disabled:!text-orange flex-1 normal-case hover:text-white disabled:!bg-transparent disabled:!opacity-70 md:max-w-[200px]"
              >
                {isFetching ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Loading...
                  </>
                ) : (
                  <>
                    See More Referrals
                    <IoChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </Suspense>
  );
};
