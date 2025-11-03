import { useQuery } from "@tanstack/react-query";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { getOpportunityInfoById } from "~/api/services/opportunities";
import OpportunityPublicSmallRow from "../Opportunity/OpportunityPublicSmallRow";

interface PathwayTaskOpportunityPublicProps {
  opportunityId: string;
}

const PathwayTaskOpportunityPublic: React.FC<
  PathwayTaskOpportunityPublicProps
> = ({ opportunityId }) => {
  const { data: opportunity, isLoading } = useQuery<OpportunityInfo>({
    queryKey: ["opportunityInfo", opportunityId],
    queryFn: () => getOpportunityInfoById(opportunityId),
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

  return <OpportunityPublicSmallRow opportunity={opportunity as any} />;
};

export default PathwayTaskOpportunityPublic;
