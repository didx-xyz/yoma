import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IoChevronDown, IoGift } from "react-icons/io5";
import type {
  ProgramInfo,
  ProgramSearchResultsInfo,
} from "~/api/models/referrals";
import { searchReferralProgramsInfo } from "~/api/services/referrals";
import { ProgramCard } from "./ProgramCard";
import Suspense from "~/components/Common/Suspense";
import NoRowsMessage from "~/components/NoRowsMessage";

interface ProgramsListProps {
  onProgramClick?: (program: ProgramInfo) => void;
  onCreateLink?: (program: ProgramInfo) => void;
  initialPageSize?: number;
  showHeader?: boolean;
  showDescription?: boolean;
  context?: "list" | "select" | "preview";
}

export const ProgramsList: React.FC<ProgramsListProps> = ({
  onProgramClick,
  onCreateLink,
  initialPageSize = 4,
  showHeader = true,
  showDescription = true,
  context = "list",
}) => {
  const [pageSize, setPageSize] = useState(initialPageSize);

  const {
    data: programsData,
    error: programsError,
    isLoading: programsIsLoading,
    isFetching: programsIsFetching,
  } = useQuery<ProgramSearchResultsInfo>({
    queryKey: ["ReferralPrograms", pageSize],
    queryFn: () =>
      searchReferralProgramsInfo({
        pageNumber: 1,
        pageSize: pageSize,
        valueContains: null,
        includeExpired: false,
      }),
    placeholderData: (previousData) => previousData,
  });

  const hasPrograms = (programsData?.items?.length ?? 0) > 0;
  const hasMorePrograms = (programsData?.totalCount ?? 0) > pageSize;

  const handleLoadMore = useCallback(() => {
    setPageSize((prev) => prev + 5);
  }, []);

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

      <Suspense
        isLoading={programsIsLoading && !programsData}
        error={programsError as any}
      >
        {!hasPrograms && (
          <NoRowsMessage
            title="No Programs Available"
            description="There are currently no active referral programs. Check back soon!"
            icon={"🎁"}
          />
        )}

        {hasPrograms && (
          <div className="space-y-3">
            {programsData?.items?.map((program: ProgramInfo) => (
              <ProgramCard
                key={program.id}
                program={program}
                onClick={() => onProgramClick?.(program)}
                onCreateLink={() => onCreateLink?.(program)}
                context={context}
              />
            ))}

            {/* See More Button */}
            {hasMorePrograms && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleLoadMore}
                  disabled={programsIsFetching}
                  className="btn btn-sm gap-2 border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                >
                  {programsIsFetching ? (
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
