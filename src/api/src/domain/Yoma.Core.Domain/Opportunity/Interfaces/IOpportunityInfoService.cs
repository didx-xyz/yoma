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

    (string fileName, byte[] bytes) ExportToCSV(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization, bool appendDateStamp);

    Task<(bool scheduleForProcessing, string? fileName, byte[]? bytes)> ExportOrScheduleToCSV(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization);
  }
}
