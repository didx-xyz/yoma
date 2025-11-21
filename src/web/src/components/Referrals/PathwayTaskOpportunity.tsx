import { useQuery } from "@tanstack/react-query";
import type { Opportunity, OpportunityInfo } from "~/api/models/opportunity";
import {
  getOpportunityById,
  getOpportunityInfoById,
} from "~/api/services/opportunities";
import OpportunityPublicSmallRow from "../Opportunity/OpportunityPublicSmallRow";
import { TaskWarning } from "./InstructionHeaders";
import Suspense from "../Common/Suspense";
import { LoadingSkeleton } from "../Status/LoadingSkeleton";

interface PathwayTaskOpportunityProps {
  opportunityId: string;
  opportunity?: Opportunity | OpportunityInfo; // Optional: provide to avoid fetching
  isCompleted?: boolean;
  /** Set to true to fetch full Opportunity data (admin), false for OpportunityInfo (public) */
  isAdmin?: boolean;
}

/**
 * Unified display component for pathway task opportunities.
 * If opportunity data is provided, it uses it directly (avoids fetch).
 * Otherwise, fetches by ID using either admin or public endpoint.
 */
const PathwayTaskOpportunity: React.FC<PathwayTaskOpportunityProps> = ({
  opportunityId,
  opportunity,
  isCompleted = false,
  isAdmin = false,
}) => {
  // Fetch opportunity data based on isAdmin flag
  const {
    data: fetchedOpportunity,
    isLoading,
    error,
  } = useQuery<Opportunity | OpportunityInfo>({
    queryKey: isAdmin
      ? ["opportunity", opportunityId]
      : ["opportunityInfo", opportunityId],
    queryFn: () =>
      isAdmin
        ? getOpportunityById(opportunityId)
        : getOpportunityInfoById(opportunityId),
    enabled: !!opportunityId && !opportunity,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Use provided opportunity or fetched opportunity
  const displayOpportunity = opportunity || fetchedOpportunity;

  // Handle loading and error states for fetched data only
  if (!opportunity) {
    // Admin: show full error details
    if (isAdmin) {
      return (
        <Suspense
          isLoading={isLoading}
          error={error}
          loader={
            <div className="h-[121.333px] items-center rounded-lg border border-gray-200 bg-white p-3">
              <LoadingSkeleton rows={1} columns={1} className="" height="" />
            </div>
          }
        >
          {displayOpportunity ? (
            <div className="flex flex-col gap-2">
              <OpportunityPublicSmallRow
                opportunity={displayOpportunity as any}
                isCompleted={isCompleted}
              />

              {/* Non-Completable Warning */}
              {displayOpportunity.isCompletable === false &&
                displayOpportunity.nonCompletableReason && (
                  <TaskWarning
                    reason={displayOpportunity.nonCompletableReason}
                  />
                )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-500">
                <span>⚠️</span>
                <span>Opportunity not found</span>
              </div>
              <TaskWarning />
            </>
          )}
        </Suspense>
      );
    }

    // Non-admin: show TaskWarning on error, loading skeleton while loading
    if (isLoading) {
      return (
        <div className="h-[121.333px] items-center rounded-lg border border-gray-200 bg-white p-3">
          <LoadingSkeleton rows={1} columns={1} className="" height="" />
        </div>
      );
    }

    if (error || !displayOpportunity) {
      return <TaskWarning />;
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <OpportunityPublicSmallRow
        opportunity={displayOpportunity as any}
        isCompleted={isCompleted}
      />

      {/* Non-Completable Warning */}
      {displayOpportunity?.isCompletable === false &&
        displayOpportunity?.nonCompletableReason && (
          <TaskWarning reason={displayOpportunity.nonCompletableReason} />
        )}
    </div>
  );
};

export default PathwayTaskOpportunity;
