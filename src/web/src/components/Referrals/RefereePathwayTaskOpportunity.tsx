import { useQuery } from "@tanstack/react-query";
import type { OpportunityInfo, Opportunity } from "~/api/models/opportunity";
import { getOpportunityInfoById } from "~/api/services/opportunities";
import OpportunityPublicSmallRow from "../Opportunity/OpportunityPublicSmallRow";

interface RefereePathwayTaskOpportunityProps {
  opportunityId: string;
  mockOpportunity?: Opportunity;
  isCompleted?: boolean;
}

const RefereePathwayTaskOpportunity: React.FC<
  RefereePathwayTaskOpportunityProps
> = ({ opportunityId, mockOpportunity, isCompleted = false }) => {
  const { data: opportunity, isLoading } = useQuery<OpportunityInfo>({
    queryKey: ["opportunityInfo", opportunityId],
    queryFn: () => getOpportunityInfoById(opportunityId),
    enabled: !!opportunityId && !mockOpportunity,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use mock opportunity if provided (for preview mode)
  const displayOpportunity = mockOpportunity || opportunity;

  if (!mockOpportunity && isLoading) {
    return (
      <div className="flex h-[121.333px] items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-500">
        <span className="loading loading-spinner loading-sm"></span>
        <span>Loading opportunity details...</span>
      </div>
    );
  }

  if (!displayOpportunity) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-500">
        <span>⚠️</span>
        <span>Opportunity not found</span>
      </div>
    );
  }

  return (
    <OpportunityPublicSmallRow
      opportunity={displayOpportunity as any}
      isCompleted={isCompleted}
    />
  );
};

export default RefereePathwayTaskOpportunity;
