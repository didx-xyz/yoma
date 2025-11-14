import { useQuery } from "@tanstack/react-query";
import type { Opportunity } from "~/api/models/opportunity";
import { getOpportunityById } from "~/api/services/opportunities";
import OpportunityPublicSmallRow from "../Opportunity/OpportunityPublicSmallRow";

interface AdminPathwayTaskOpportunityProps {
  opportunityId: string;
  mockOpportunity?: Opportunity;
}

const AdminPathwayTaskOpportunity: React.FC<AdminPathwayTaskOpportunityProps> = ({
  opportunityId,
  mockOpportunity,
}) => {
  const { data: opportunity, isLoading } = useQuery<Opportunity>({
    queryKey: ["opportunity", opportunityId],
    queryFn: () => getOpportunityById(opportunityId),
    enabled: !!opportunityId && !mockOpportunity,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use mock opportunity if provided, otherwise use fetched data
  const displayOpportunity = mockOpportunity || opportunity;

  if (isLoading && !mockOpportunity) {
    return (
      <div className="flex h-[121.333px] items-center gap-2 text-sm text-gray-500">
        <span className="loading loading-spinner loading-sm"></span>
        <span>Loading opportunity details...</span>
      </div>
    );
  }

  if (!displayOpportunity) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>⚠️</span>
        <span>Opportunity not found</span>
      </div>
    );
  }

  return <OpportunityPublicSmallRow opportunity={displayOpportunity} />;
};

export default AdminPathwayTaskOpportunity;
