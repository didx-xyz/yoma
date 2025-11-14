import { useCallback } from "react";
import { IoChevronDown, IoGift } from "react-icons/io5";
import type { ProgramInfo } from "~/api/models/referrals";
import { searchReferralProgramsInfo } from "~/api/services/referrals";
import { RefereeProgramDetails } from "./RefereeProgramDetails";
import Suspense from "~/components/Common/Suspense";
import NoRowsMessage from "~/components/NoRowsMessage";
import { usePaginatedQuery } from "~/hooks/usePaginatedQuery";

interface ProgramsListProps {
  onProgramClick?: (program: ProgramInfo) => void;
  onCreateLink?: (program: ProgramInfo) => void;
  initialPageSize?: number;
  showHeader?: boolean;
  showDescription?: boolean;
  context?: "list" | "select" | "preview";
}

export const ReferrerProgramsList: React.FC<ProgramsListProps> = ({
  onProgramClick,
  onCreateLink,
  initialPageSize = 4,
  showHeader = true,
  showDescription = true,
  context = "list",
}) => {
  const {
    items: programs,
    error,
    isLoading,
    isFetching,
    hasMore,
    loadMore,
  } = usePaginatedQuery<ProgramInfo>({
    queryKey: ["ReferralPrograms"],
    queryFn: async (pageNumber, pageSize) => {
      const result = await searchReferralProgramsInfo({
        pageNumber,
        pageSize,
        valueContains: null,
        includeExpired: false,
      });
      return {
        items: result.items || [],
        totalCount: result.totalCount || 0,
      };
    },
    pageSize: initialPageSize,
  });

  const hasPrograms = programs.length > 0;

  return (
    <div className={showHeader ? "shadow-custom rounded-lg bg-white p-6" : ""}>
      {showHeader && (
        <>
          <h2 className="mb-2 flex items-center gap-4 text-lg font-bold text-gray-900">
            <IoGift className="inline h-8 w-8 text-orange-500" /> Available
            Programs
          </h2>
          {showDescription && (
            <p className="mb-4 text-sm text-gray-600">
              Please choose from our available programs below to create your
              referral link.
            </p>
          )}
        </>
      )}

      <Suspense isLoading={isLoading && !hasPrograms} error={error as any}>
        {!hasPrograms && (
          <NoRowsMessage
            title="No Programs Available"
            description="There are currently no active referral programs. Check back soon!"
            icon={"🎁"}
          />
        )}

        {hasPrograms && (
          <div className="space-y-3">
            {programs?.map((program: ProgramInfo) => (
              <RefereeProgramDetails
                key={program.id}
                program={program}
                onClick={() => onProgramClick?.(program)}
                onCreateLink={() => onCreateLink?.(program)}
                context={context}
                perspective="referrer"
              />
            ))}

            {/* See More Button */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={loadMore}
                  disabled={isFetching}
                  className="btn btn-sm gap-2 border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                >
                  {isFetching ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Loading...
                    </>
                  ) : (
                    <>
                      See More Programs
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
