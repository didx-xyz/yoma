using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Interfaces
{
  public interface IOpportunityInfoService
  {
    OpportunityInfo GetById(Guid id, bool ensureOrganizationAuthorization);

    OpportunityInfo? GetPublishedOrExpiredById(Guid id);

    OpportunityInfo GetPublishedOrExpiredByLinkInstantVerify(Guid linkId);

    OpportunitySearchResultsInfo Search(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization);

    OpportunitySearchResultsInfo Search(OpportunitySearchFilter filter);

    Task<(bool scheduleForProcessing, string? fileName, byte[]? bytes)> SearchAndExportToCSV(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization);
  }
}
