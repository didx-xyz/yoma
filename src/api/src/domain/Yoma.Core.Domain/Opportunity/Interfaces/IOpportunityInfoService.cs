using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Interfaces
{
    public interface IOpportunityInfoService
    {
        OpportunityInfo? GetById(Guid id, bool ensureOrganizationAuthorization);

        OpportunityInfo? GetActiveExpiredByIdOrNull(Guid id, bool? includeExpired);

        OpportunitySearchResultsInfo Search(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization);

        OpportunitySearchResultsInfo Search(OpportunitySearchFilter filter);
    }
}
