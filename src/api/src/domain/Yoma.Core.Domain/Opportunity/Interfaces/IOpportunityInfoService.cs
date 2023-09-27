using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Interfaces
{
    public interface IOpportunityInfoService
    {
        OpportunityInfo GetInfoById(Guid id, bool includeChildren);

        OpportunityInfo? GetInfoByTitleOrNull(string title, bool includeChildItems);

        OpportunitySearchResultsInfo Search(OpportunitySearchFilter filter);
    }
}
