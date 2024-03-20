using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Interfaces
{
  public interface IOpportunityInfoService
  {
    OpportunityInfo GetById(Guid id, bool ensureOrganizationAuthorization);

    OpportunityInfo? GetPublishedOrExpiredById(Guid id);

    OpportunitySearchResultsInfo Search(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization);

    OpportunitySearchResultsInfo Search(OpportunitySearchFilter filter);

    (string fileName, byte[] bytes) ExportToCSVOpportunitySearch(OpportunitySearchFilterAdmin filter);
  }
}
