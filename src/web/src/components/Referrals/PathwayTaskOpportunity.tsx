import { useQuery } from "@tanstack/react-query";
import type { Opportunity } from "~/api/models/opportunity";
import { getOpportunityById } from "~/api/services/opportunities";
import OpportunityPublicSmallRow from "../Opportunity/OpportunityPublicSmallRow";

interface PathwayTaskOpportunityProps {
  opportunityId: string;
}

const PathwayTaskOpportunity: React.FC<PathwayTaskOpportunityProps> = ({
  opportunityId,
}) => {
  const { data: opportunity, isLoading } = useQuery<Opportunity>({
    queryKey: ["opportunity", opportunityId],
    queryFn: () => getOpportunityById(opportunityId),
    enabled: !!opportunityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex h-[121.333px] items-center gap-2 text-sm text-gray-500">
        <span className="loading loading-spinner loading-sm"></span>
        <span>Loading opportunity details...</span>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>⚠️</span>
        <span>Opportunity not found</span>
      </div>
    );
  }

  return <OpportunityPublicSmallRow opportunity={opportunity} />;
};

export default PathwayTaskOpportunity;
