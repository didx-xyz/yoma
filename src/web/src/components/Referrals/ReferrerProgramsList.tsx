import { IoAdd, IoChevronDown, IoGift } from "react-icons/io5";
import type { ProgramInfo } from "~/api/models/referrals";
import { searchReferralProgramsInfo } from "~/api/services/referrals";
import Suspense from "~/components/Common/Suspense";
import NoRowsMessage from "~/components/NoRowsMessage";
import { usePaginatedQuery } from "~/hooks/usePaginatedQuery";
import { LoadingInline } from "../Status/LoadingInline";
import ProgramBadges from "./ProgramBadges";
import { ProgramRow } from "./ProgramRow";

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
        countries: null, // auto-filtered by user country when available, including WW (authenticated users)
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
    <div className={showHeader ? "rounded-xl bg-white p-4 md:p-6" : ""}>
      {showHeader && (
        <>
          <h2 className="mb-2 flex items-center gap-4 text-lg font-bold text-gray-900">
            <IoGift className="inline h-6 w-6 text-blue-600" /> Available
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
        isLoading={isLoading && !hasPrograms}
        error={error as any}
        loader={
          <LoadingInline
            className="rounded-xl bg-white p-4"
            classNameSpinner="h-12 border-orange w-12"
          />
        }
      >
        {!hasPrograms && (
          <NoRowsMessage
            title="No Programs Available"
            description="There are currently no active referral programs. Check back soon!"
            icon={"🎁"}
          />
        )}

        {hasPrograms && (
          <div className="space-y-2">
            {programs?.map((program: ProgramInfo) => (
              <ProgramRow
                key={program.id}
                program={program}
                onClick={() => onProgramClick?.(program)}
                action={
                  context !== "preview" ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (context === "select") {
                          onProgramClick?.(program);
                          return;
                        }

                        onCreateLink?.(program);
                      }}
                      disabled={program.status !== "Active"}
                      className="btn btn-sm gap-2 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                    >
                      <IoAdd className="h-4 w-4" />
                      {context === "select" ? "Select Program" : "Create Link"}
                    </button>
                  ) : null
                }
              >
                <ProgramBadges
                  program={program}
                  showToolTips={false}
                  showBadges={{ requirements: false, limit: false }}
                />
              </ProgramRow>
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
