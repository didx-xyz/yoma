import { FaLink, FaPlus } from "react-icons/fa";
import { IoChevronDown } from "react-icons/io5";
import type { ReferralLink, ProgramInfo } from "~/api/models/referrals";
import { searchReferralLinks } from "~/api/services/referrals";
import { ReferrerLinkCard } from "./ReferrerLinkCard";
import Suspense from "~/components/Common/Suspense";
import NoRowsMessage from "~/components/NoRowsMessage";
import { usePaginatedQuery } from "~/hooks/usePaginatedQuery";

interface LinksListProps {
  programs?: ProgramInfo[];
  onViewUsage?: (link: ReferralLink) => void;
  onEdit?: (link: ReferralLink) => void;
  onCreateLink?: () => void;
  initialPageSize?: number;
}

export const ReferrerLinksList: React.FC<LinksListProps> = ({
  programs = [],
  onViewUsage,
  onEdit,
  onCreateLink,
  initialPageSize = 3,
}) => {
  const {
    items: links,
    error,
    isLoading,
    isFetching,
    hasMore,
    loadMore,
  } = usePaginatedQuery<ReferralLink>({
    queryKey: ["ReferralLinks"],
    queryFn: async (pageNumber, pageSize) => {
      const result = await searchReferralLinks({
        pageNumber,
        pageSize,
        programId: null,
        valueContains: null,
        statuses: null,
      });
      return {
        items: result.items || [],
        totalCount: result.totalCount || 0,
      };
    },
    pageSize: initialPageSize,
  });

  const hasLinks = links.length > 0;
  const hasPrograms = programs.length > 0;

  return (
    <div className="rounded-lg bg-white p-4 md:p-6">
      <div className="items-centers mb-4 flex flex-col gap-2 md:flex-row md:justify-between md:gap-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 md:text-lg">
          <FaLink className="inline h-5 w-5 text-blue-600 md:h-6 md:w-6" />
          Your Referral Links
        </h2>
        {hasPrograms && onCreateLink && (
          <button
            onClick={onCreateLink}
            className="btn btn-sm gap-2 border-blue-600 bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:bg-blue-700"
          >
            <FaPlus className="h-3 w-3" />
            Create Link
          </button>
        )}
      </div>

      <Suspense isLoading={isLoading && !hasLinks} error={error as any}>
        {!hasLinks && !hasPrograms && (
          <NoRowsMessage
            title="No Links Yet"
            description="You haven't created any referral links yet. Create one now!"
            icon={"🔗"}
          />
        )}
        {!hasLinks && hasPrograms && (
          <NoRowsMessage
            title="Create Your First Link"
            description="Start sharing Yoma and earning rewards together with your network!"
            icon={"🔗"}
          />
        )}

        {hasLinks && (
          <div className="space-y-3">
            {links?.map((link: ReferralLink) => (
              <div key={link.id}>
                <div className="divider my-3"></div>
                <ReferrerLinkCard
                  link={link}
                  programs={programs}
                  onClick={onViewUsage}
                  onViewUsage={onViewUsage}
                  onEdit={onEdit}
                />
              </div>
            ))}

            {/* See More Button */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={loadMore}
                  disabled={isFetching}
                  className="btn btn-sm gap-2 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  {isFetching ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Loading...
                    </>
                  ) : (
                    <>
                      See More Links
                      <IoChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </Suspense>
    </div>
  );
};
