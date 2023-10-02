using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Interfaces
{
    public interface IOpportunityInfoService
    {
        OpportunityInfo GetInfoById(Guid id, bool includeChildren, bool includeComputed);

        OpportunityInfo? GetInfoByTitleOrNull(string title, bool includeChildItems, bool includeComputed);

        OpportunitySearchResultsInfo Search(OpportunitySearchFilter filter);
    }
}
