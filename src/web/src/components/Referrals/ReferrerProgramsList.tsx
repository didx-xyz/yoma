import { IoAdd, IoChevronDown } from "react-icons/io5";
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
  context?: "list" | "select" | "preview";
}

export const ReferrerProgramsList: React.FC<ProgramsListProps> = ({
  onProgramClick,
  onCreateLink,
  initialPageSize = 4,
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
                    className="btn btn-sm bg-orange gap-2 text-white hover:brightness-110 disabled:opacity-50"
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
                className="btn btn-sm border-orange gap-2 text-orange-700 hover:bg-orange-100 disabled:opacity-50"
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
  );
};
