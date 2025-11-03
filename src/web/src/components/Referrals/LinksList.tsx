import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaLink, FaPlus } from "react-icons/fa";
import { IoChevronDown } from "react-icons/io5";
import type {
  ReferralLink,
  ReferralLinkSearchResults,
  ProgramInfo,
} from "~/api/models/referrals";
import { searchReferralLinks } from "~/api/services/referrals";
import { LinkCard } from "./LinkCard";
import Suspense from "~/components/Common/Suspense";
import NoRowsMessage from "~/components/NoRowsMessage";

interface LinksListProps {
  programs?: ProgramInfo[];
  onViewUsage?: (link: ReferralLink) => void;
  onEdit?: (link: ReferralLink) => void;
  onCreateLink?: () => void;
  initialPageSize?: number;
}

export const LinksList: React.FC<LinksListProps> = ({
  programs = [],
  onViewUsage,
  onEdit,
  onCreateLink,
  initialPageSize = 3,
}) => {
  const [pageSize, setPageSize] = useState(initialPageSize);

  const {
    data: linksData,
    error: linksError,
    isLoading: linksIsLoading,
    isFetching: linksIsFetching,
  } = useQuery<ReferralLinkSearchResults>({
    queryKey: ["ReferralLinks", pageSize],
    queryFn: () =>
      searchReferralLinks({
        pageNumber: 1,
        pageSize: pageSize,
        programId: null,
        valueContains: null,
        statuses: null,
      }),
    placeholderData: (previousData) => previousData,
  });

  const hasLinks = (linksData?.items?.length ?? 0) > 0;
  const hasPrograms = programs.length > 0;
  const hasMoreLinks = (linksData?.totalCount ?? 0) > pageSize;

  const handleLoadMore = useCallback(() => {
    setPageSize((prev) => prev + 5);
  }, []);

  return (
    <div className="shadow-custom rounded-lg bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-4 text-lg font-bold text-gray-900">
          <FaLink className="inline h-6 w-6 text-blue-600" /> My Referral Links
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

      <Suspense
        isLoading={linksIsLoading && !linksData}
        error={linksError as any}
      >
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
            {linksData?.items?.map((link: ReferralLink) => (
              <LinkCard
                key={link.id}
                link={link}
                programs={programs}
                onClick={onViewUsage}
                onViewUsage={onViewUsage}
                onEdit={onEdit}
              />
            ))}

            {/* See More Button */}
            {hasMoreLinks && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleLoadMore}
                  disabled={linksIsFetching}
                  className="btn btn-sm gap-2 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  {linksIsFetching ? (
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
